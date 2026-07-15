<script setup lang="ts">
import type { Book } from '@library/contracts';

const { $orpc } = useNuxtApp();

const { data: books, refresh } = await useAsyncData("books", () => $orpc.listBooks());

const form = reactive({
  title: "",
  author: "",
  year: null as number | null,
});

const bookId = ref('')
const findedBook = ref<null | Book>(null)
const isSubmittingBook = ref(false)

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

async function findBookById() {
  if(!bookId.value.trim()) return
  isSubmittingBook.value = true;
  error.value = null;
  findedBook.value = null

  try {
    findedBook.value = await $orpc.findBookById({id: bookId.value})
    bookId.value = ''

  } catch (e){
    error.value = e instanceof Error ? e.message : "Failed to find book";
  } finally {
    isSubmittingBook.value = false;
  }
}


function removeFindedBook(id: string){
  if(!id) return
  findedBook.value = null
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

      <BookCard v-if="findedBook" :book="findedBook" class="mb-8" @delete="removeFindedBook" />

      <p
        v-if="error"
        class="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300"
      >
        {{ error }}
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <BookCard v-for="book in books" :key="book.id" :book="book" @delete="removeBook" />
      </div>

      <p v-if="!books || books.length === 0" class="mt-10 text-center text-sm text-slate-500">
        Жодної книги в каталозі. Додай через форму вище.
      </p>
    </div>
  </main>
</template>
