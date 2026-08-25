<script setup lang="ts">
import type { Book } from "@library/contracts";

const { $orpc, $auth } = useNuxtApp();
const session = $auth.useSession();
const userId = computed(() => session.value.data?.user.id ?? null);

const page = ref(1);
const limit = ref(12);
const sort = ref<"title" | "year" | "createdAt">("createdAt");
const order = ref<"asc" | "desc">("desc");
const listSearch = ref("");
const tab = ref<"all" | "mine">("all");
const genre = ref("");

const { data, refresh } = await useAsyncData(
  "books",
  () =>
    $orpc.listBooks({
      page: page.value,
      limit: limit.value,
      sort: sort.value,
      order: order.value,
      search: listSearch.value.trim() || undefined,
      owner: tab.value,
      genre: genre.value || undefined,
    }),
  { watch: [page, limit, sort, order, listSearch, tab, genre] },
);

const books = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

watch([listSearch, sort, order, tab, genre], () => {
  page.value = 1;
});

const form = reactive({
  title: "",
  author: "",
  year: null as number | null,
  isbn: "",
});

const bookId = ref("");
const findedBook = ref<null | Book>(null);
const isSubmittingBook = ref(false);

const isSubmitting = ref(false);
const error = ref<string | null>(null);

async function addBook() {
  if (!form.title.trim() || !form.author.trim()) return;
  isSubmitting.value = true;
  error.value = null;
  try {
    await $orpc.createBook({
      title: form.title.trim(),
      author: form.author.trim(),
      year: form.year,
      isbn: form.isbn.trim() || null,
    });
    form.title = "";
    form.author = "";
    form.year = null;
    form.isbn = "";
    await refresh();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to add book";
  } finally {
    isSubmitting.value = false;
  }
}

async function findBookById() {
  if (!bookId.value.trim()) return;
  isSubmittingBook.value = true;
  error.value = null;
  findedBook.value = null;

  try {
    findedBook.value = await $orpc.findBookById({ id: bookId.value });
    bookId.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to find book";
  } finally {
    isSubmittingBook.value = false;
  }
}

function removeFindedBook(id: string) {
  if (!id) return;
  findedBook.value = null;
}

const { data: shelvesData, refresh: refreshShelves } = await useAsyncData(
  "shelves",
  () => (userId.value ? $orpc.listShelves() : Promise.resolve([])),
  { watch: [userId] },
);
const shelves = computed(() => shelvesData.value ?? []);

const { data: genresData } = await useAsyncData("genres", () => $orpc.listGenres());
const allGenres = computed(() => genresData.value ?? []);

const { data: statsData, refresh: refreshStats } = await useAsyncData(
  "stats",
  () => (userId.value ? $orpc.readingStats({}) : Promise.resolve(null)),
  { watch: [userId] },
);
const stats = computed(() => statsData.value?.years ?? []);

async function onShelved() {
  await Promise.all([refresh(), refreshShelves(), refreshStats()]);
}

async function removeBook(id: string) {
  try {
    await $orpc.deleteBook({ id });
    await refresh();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to delete book";
  }
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_30%_30%,rgba(96,165,250,0.18),transparent_60%),radial-gradient(50%_40%_at_70%_70%,rgba(192,132,252,0.16),transparent_60%)]"
    />

    <div class="mx-auto max-w-5xl px-6 py-16">
      <header class="mb-10 text-center">
        <h1
          class="mt-3 bg-gradient-to-br from-sky-400 to-fuchsia-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
        >
          Personal Library
        </h1>
        <p class="mt-3 text-base text-slate-400">{{ total }} books in the catalogue</p>
      </header>

      <AuthPanel @changed="onShelved()" />

      <div v-if="userId && shelves.length" class="mb-8 grid gap-3 sm:grid-cols-3">
        <div
          v-for="shelf in shelves"
          :key="shelf.id"
          class="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md"
        >
          <p class="text-2xl font-semibold text-slate-100">{{ shelf.bookCount }}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-slate-400">{{ shelf.name }}</p>
        </div>
      </div>

      <form
        v-if="userId"
        @submit.prevent="addBook"
        class="mb-10 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:grid-cols-[1fr_1fr_110px_150px_auto]"
      >
        <input
          v-model="form.title"
          required
          placeholder="Title"
          class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <input
          v-model="form.author"
          required
          placeholder="Author"
          class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <input
          v-model.number="form.year"
          type="number"
          min="0"
          max="9999"
          placeholder="Year"
          class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <input
          v-model="form.isbn"
          placeholder="ISBN"
          class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <button
          type="submit"
          :disabled="isSubmitting"
          class="rounded-lg bg-gradient-to-br cursor-pointer from-sky-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ isSubmitting ? "Adding..." : "Add book" }}
        </button>
      </form>

      <form
        @submit.prevent="findBookById"
        class="mb-8 flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
      >
        <input
          v-model="bookId"
          placeholder="Search book by id…"
          class="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <button
          type="submit"
          :disabled="isSubmittingBook"
          class="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
          {{ isSubmittingBook ? "Search..." : "Search" }}
        </button>
      </form>

      <BookCard
        v-if="findedBook"
        :book="findedBook"
        :can-delete="findedBook.ownerId !== null && findedBook.ownerId === userId"
        :can-shelve="!!userId"
        class="mb-8"
        @delete="removeFindedBook"
        @shelved="onShelved"
      />

      <p
        v-if="error"
        class="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300"
      >
        {{ error }}
      </p>

      <div
        v-if="userId && stats.length"
        class="mb-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
      >
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Reading stats by year
        </h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="pb-2 font-medium">Year</th>
              <th class="pb-2 font-medium">Books</th>
              <th class="pb-2 font-medium">Pages</th>
              <th class="pb-2 font-medium">Avg rating</th>
              <th class="pb-2 font-medium">Top genre</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stats" :key="row.year" class="border-t border-white/5">
              <td class="py-2 font-medium text-slate-200">{{ row.year }}</td>
              <td class="py-2 text-slate-300">{{ row.booksFinished }}</td>
              <td class="py-2 text-slate-300">{{ row.totalPages.toLocaleString() }}</td>
              <td class="py-2 text-slate-300">{{ row.averageRating ?? "—" }}</td>
              <td class="py-2 text-slate-300">{{ row.topGenre ?? "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        v-if="!userId"
        class="mb-10 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400 backdrop-blur-md"
      >
        Sign in to add books to the catalogue.
      </p>

      <div
        class="mb-4 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
      >
        <button
          v-for="t in ['all', 'mine'] as const"
          :key="t"
          :disabled="t === 'mine' && !userId"
          @click="tab = t"
          class="flex-1 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            tab === t
              ? 'bg-gradient-to-br from-sky-400 to-fuchsia-400 text-slate-950'
              : 'text-slate-300 hover:bg-white/10'
          "
        >
          {{ t === "all" ? "All books" : "My books" }}
        </button>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <input
          v-model="listSearch"
          placeholder="Filter by title…"
          class="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <select
          v-model="genre"
          class="cursor-pointer rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
        >
          <option value="">All genres</option>
          <option v-for="g in allGenres" :key="g.id" :value="g.slug">
            {{ g.name }} ({{ g.bookCount }})
          </option>
        </select>
        <select
          v-model="sort"
          class="cursor-pointer rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
        >
          <option value="createdAt">Sort: Newest</option>
          <option value="title">Sort: Title</option>
          <option value="year">Sort: Year</option>
        </select>
        <button
          @click="order = order === 'asc' ? 'desc' : 'asc'"
          class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          {{ order === "asc" ? "↑ Asc" : "↓ Desc" }}
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <BookCard
          v-for="book in books"
          :key="book.id"
          :book="book"
          :can-delete="book.ownerId !== null && book.ownerId === userId"
          :can-shelve="!!userId"
          @delete="removeBook"
          @shelved="onShelved"
        />
      </div>

      <p v-if="books.length === 0" class="mt-10 text-center text-sm text-slate-500">
        No books match your filters.
      </p>

      <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-4">
        <button
          :disabled="page <= 1"
          @click="page--"
          class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>
        <span class="text-sm text-slate-400">Page {{ page }} of {{ totalPages }}</span>
        <button
          :disabled="page >= totalPages"
          @click="page++"
          class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  </main>
</template>
