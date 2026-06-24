<script setup lang="ts">
const { $orpc } = useNuxtApp();

const { data: books, refresh } = await useAsyncData("books", () => $orpc.listBooks());

const form = reactive({
  title: "",
  author: "",
  year: null as number | null,
});

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
    });
    form.title = "";
    form.author = "";
    form.year = null;
    await refresh();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to add book";
  } finally {
    isSubmitting.value = false;
  }
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
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Nuxt 4 · Hono · oRPC · Postgres
        </p>
        <h1
          class="mt-3 bg-gradient-to-br from-sky-400 to-fuchsia-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
        >
          Personal Library
        </h1>
        <p class="mt-3 text-base text-slate-400">{{ books?.length ?? 0 }} books in the catalogue</p>
      </header>

      <form
        @submit.prevent="addBook"
        class="mb-10 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:grid-cols-[1fr_1fr_120px_auto]"
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
        <button
          type="submit"
          :disabled="isSubmitting"
          class="rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ isSubmitting ? "Adding..." : "Add book" }}
        </button>
      </form>

      <p
        v-if="error"
        class="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300"
      >
        {{ error }}
      </p>

      <ul class="grid gap-4 sm:grid-cols-2">
        <li
          v-for="book in books"
          :key="book.id"
          class="group relative rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
        >
          <button
            @click="removeBook(book.id)"
            class="absolute right-3 top-3 rounded-md p-1 text-slate-500 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100"
            aria-label="Delete book"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <h2 class="pr-6 text-lg font-semibold text-slate-100 transition group-hover:text-white">
            {{ book.title }}
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            {{ book.author }}<span v-if="book.year"> · {{ book.year }}</span>
          </p>
        </li>
      </ul>

      <p v-if="!books || books.length === 0" class="mt-10 text-center text-sm text-slate-500">
        Жодної книги в каталозі. Додай через форму вище.
      </p>
    </div>
  </main>
</template>
