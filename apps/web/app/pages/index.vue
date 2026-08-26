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
const customShelves = computed(() =>
  shelves.value.filter((shelf) => shelf.kind === "custom").map(({ id, name }) => ({ id, name })),
);

const { data: genresData } = await useAsyncData("genres", () => $orpc.listGenres());
const allGenres = computed(() => genresData.value ?? []);

const { data: statsData, refresh: refreshStats } = await useAsyncData(
  "stats",
  () => (userId.value ? $orpc.readingStats({}) : Promise.resolve(null)),
  { watch: [userId] },
);
const stats = computed(() => statsData.value?.years ?? []);

const { data: picksData, refresh: refreshPicks } = await useAsyncData(
  "recommendations",
  () => (userId.value ? $orpc.recommendations({ limit: 6 }) : Promise.resolve([])),
  { watch: [userId] },
);
const picks = computed(() => picksData.value ?? []);

const { data: goalsData, refresh: refreshGoals } = await useAsyncData(
  "goals",
  () => (userId.value ? $orpc.readingGoals() : Promise.resolve([])),
  { watch: [userId] },
);
const goals = computed(() => goalsData.value ?? []);

const newShelfName = ref("");
const shelfBusy = ref(false);

async function createShelf() {
  const name = newShelfName.value.trim();
  if (!name) return;
  shelfBusy.value = true;
  error.value = null;
  try {
    await $orpc.createShelf({ name });
    newShelfName.value = "";
    await refreshShelves();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to create the shelf";
  } finally {
    shelfBusy.value = false;
  }
}

async function deleteShelf(shelfId: string) {
  shelfBusy.value = true;
  error.value = null;
  try {
    await $orpc.deleteShelf({ shelfId });
    await refreshShelves();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to delete the shelf";
  } finally {
    shelfBusy.value = false;
  }
}

const currentYear = new Date().getFullYear();
const goalTarget = ref(12);
const savingGoal = ref(false);

async function saveGoal() {
  savingGoal.value = true;
  error.value = null;
  try {
    await $orpc.setReadingGoal({ year: currentYear, targetBooks: goalTarget.value });
    await refreshGoals();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to save the goal";
  } finally {
    savingGoal.value = false;
  }
}

function goalPercent(goal: { booksFinished: number; targetBooks: number }) {
  return Math.min(100, Math.round((goal.booksFinished / goal.targetBooks) * 100));
}

async function onShelved() {
  await Promise.all([refresh(), refreshShelves(), refreshStats(), refreshPicks(), refreshGoals()]);
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
    <div class="px-8 py-12 lg:px-12">
      <header class="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold tracking-tight text-teal-300 sm:text-5xl">
            Personal Library
          </h1>
          <p class="mt-2 text-lg text-slate-400">{{ total }} books in the catalogue</p>
        </div>
        <NuxtLink
          v-if="userId"
          to="/friends"
          class="rounded-lg border border-teal-400/30 bg-teal-400/10 px-5 py-2.5 text-base font-medium text-teal-200 transition hover:bg-teal-400/20"
        >
          Friends &amp; feed →
        </NuxtLink>
      </header>

      <AuthPanel @changed="onShelved()" />

      <section v-if="userId" class="mb-8 rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div class="flex flex-wrap items-center gap-2">
          <div
            v-for="shelf in shelves"
            :key="shelf.id"
            class="group/shelf flex items-center gap-2.5 rounded-lg border px-3.5 py-2"
            :class="
              shelf.kind === 'custom'
                ? 'border-teal-400/25 bg-teal-400/5'
                : 'border-white/10 bg-white/5'
            "
          >
            <span class="text-xl font-semibold tabular-nums text-slate-100">
              {{ shelf.bookCount }}
            </span>
            <span class="text-sm text-slate-400">{{ shelf.name }}</span>
            <button
              v-if="shelf.kind === 'custom'"
              type="button"
              :disabled="shelfBusy"
              title="Delete shelf"
              class="cursor-pointer text-sm text-slate-600 opacity-0 transition hover:text-rose-300 group-hover/shelf:opacity-100"
              @click="deleteShelf(shelf.id)"
            >
              ✕
            </button>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <input
              v-model="newShelfName"
              type="text"
              placeholder="New shelf…"
              class="w-44 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-teal-400 focus:outline-none"
              @keyup.enter="createShelf"
            />
            <button
              type="button"
              :disabled="shelfBusy"
              class="cursor-pointer rounded-lg border border-teal-400/30 bg-teal-400/10 px-3.5 py-2 text-sm font-medium text-teal-200 transition hover:bg-teal-400/20 disabled:opacity-50"
              @click="createShelf"
            >
              Add shelf
            </button>
          </div>
        </div>
      </section>

      <p
        v-if="error"
        class="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-base text-rose-300"
      >
        {{ error }}
      </p>

      <div class="grid gap-8 xl:grid-cols-[320px_1fr]">
        <aside v-if="userId" class="space-y-6">
          <div
            v-if="userId"
            class="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Reading goals
            </h2>

            <div class="mb-4">
              <label class="mb-1.5 block text-sm text-slate-500">
                Target for {{ currentYear }}
              </label>
              <div class="flex gap-2">
                <input
                  v-model.number="goalTarget"
                  type="number"
                  min="1"
                  max="1000"
                  class="w-20 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base tabular-nums text-slate-100 focus:border-teal-400 focus:outline-none"
                />
                <button
                  type="button"
                  :disabled="savingGoal"
                  class="flex-1 cursor-pointer rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-sm font-medium text-teal-200 transition hover:bg-teal-400/20 disabled:opacity-50"
                  @click="saveGoal"
                >
                  Set goal
                </button>
              </div>
            </div>

            <p v-if="!goals.length" class="text-base text-slate-500">No goal set yet.</p>

            <ul v-else class="space-y-3">
              <li v-for="goal in goals" :key="goal.year">
                <div class="mb-1 flex justify-between text-base">
                  <span class="font-medium text-slate-200">{{ goal.year }}</span>
                  <span class="text-slate-400">
                    {{ goal.booksFinished }} / {{ goal.targetBooks }} books
                  </span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    class="h-full rounded-full bg-teal-400 transition-all"
                    :style="{ width: goalPercent(goal) + '%' }"
                  />
                </div>
              </li>
            </ul>
          </div>

          <div
            v-if="userId && stats.length"
            class="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <h2 class="mb-3 text-base font-semibold uppercase tracking-wide text-slate-400">
              Reading stats by year
            </h2>
            <ul class="space-y-4">
              <li
                v-for="row in stats"
                :key="row.year"
                class="border-t border-white/5 pt-3 first:border-0 first:pt-0"
              >
                <div class="flex items-baseline justify-between">
                  <span class="text-lg font-semibold tabular-nums text-slate-100">
                    {{ row.year }}
                  </span>
                  <span class="text-sm text-teal-300">
                    {{ row.booksFinished }} {{ row.booksFinished === 1 ? "book" : "books" }}
                  </span>
                </div>
                <dl class="mt-2 space-y-1 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-slate-500">Pages</dt>
                    <dd class="tabular-nums text-slate-300">
                      {{ row.totalPages.toLocaleString() }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-slate-500">Avg rating</dt>
                    <dd class="tabular-nums text-slate-300">{{ row.averageRating ?? "—" }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-slate-500">Top genre</dt>
                    <dd class="truncate text-slate-300">{{ row.topGenre ?? "—" }}</dd>
                  </div>
                </dl>
              </li>
            </ul>
          </div>

          <div
            v-if="userId && picks.length"
            class="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <h2 class="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Recommended for you
            </h2>
            <p class="mb-4 text-sm text-slate-500">
              Books sharing genres with the ones you finished, and not on any of your shelves.
            </p>
            <ul class="space-y-2">
              <li
                v-for="pick in picks"
                :key="pick.id"
                class="rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2"
              >
                <p class="text-base font-medium text-slate-100">{{ pick.title }}</p>
                <p class="text-sm text-slate-400">{{ pick.author }}</p>
                <p class="mt-1 text-sm text-teal-300/80">{{ pick.matchedGenres.join(", ") }}</p>
              </li>
            </ul>
          </div>
        </aside>

        <div>
          <form
            v-if="userId"
            @submit.prevent="addBook"
            class="mb-10 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:grid-cols-[1fr_1fr_110px_150px_auto]"
          >
            <input
              v-model="form.title"
              required
              placeholder="Title"
              class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            />
            <input
              v-model="form.author"
              required
              placeholder="Author"
              class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            />
            <input
              v-model.number="form.year"
              type="number"
              min="0"
              max="9999"
              placeholder="Year"
              class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            />
            <input
              v-model="form.isbn"
              placeholder="ISBN"
              class="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            />
            <button
              type="submit"
              :disabled="isSubmitting"
              class="rounded-lg cursor-pointer bg-teal-500 px-5 py-2 text-base font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
              class="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            />
            <button
              type="submit"
              :disabled="isSubmittingBook"
              class="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-teal-500 px-5 py-2 text-base font-semibold text-slate-950 transition hover:opacity-90"
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
            :custom-shelves="customShelves"
            class="mb-8"
            @delete="removeFindedBook"
            @shelved="onShelved"
          />

          <p
            v-if="!userId"
            class="mb-10 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-base text-slate-400 backdrop-blur-md"
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
              class="flex-1 cursor-pointer rounded-lg px-4 py-2 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
              :class="tab === t ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:bg-white/10'"
            >
              {{ t === "all" ? "All books" : "My books" }}
            </button>
          </div>

          <div class="mb-4 flex flex-wrap items-center gap-3">
            <input
              v-model="listSearch"
              placeholder="Filter by title…"
              class="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            />
            <select
              v-model="genre"
              class="cursor-pointer rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 focus:border-teal-400 focus:outline-none"
            >
              <option value="">All genres</option>
              <option v-for="g in allGenres" :key="g.id" :value="g.slug">
                {{ g.name }} ({{ g.bookCount }})
              </option>
            </select>
            <select
              v-model="sort"
              class="cursor-pointer rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base text-slate-100 focus:border-teal-400 focus:outline-none"
            >
              <option value="createdAt">Sort: Newest</option>
              <option value="title">Sort: Title</option>
              <option value="year">Sort: Year</option>
            </select>
            <button
              @click="order = order === 'asc' ? 'desc' : 'asc'"
              class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-base text-slate-200 transition hover:bg-white/10"
            >
              {{ order === "asc" ? "↑ Asc" : "↓ Desc" }}
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            <BookCard
              v-for="book in books"
              :key="book.id"
              :book="book"
              :can-delete="book.ownerId !== null && book.ownerId === userId"
              :can-shelve="!!userId"
              :custom-shelves="customShelves"
              @delete="removeBook"
              @shelved="onShelved"
            />
          </div>

          <p v-if="books.length === 0" class="mt-10 text-center text-base text-slate-500">
            No books match your filters.
          </p>

          <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-4">
            <button
              :disabled="page <= 1"
              @click="page--"
              class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-base text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <span class="text-base text-slate-400">Page {{ page }} of {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              @click="page++"
              class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-base text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
