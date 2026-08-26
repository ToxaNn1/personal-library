<script setup lang="ts">
import type { Book } from "@library/contracts";

withDefaults(
  defineProps<{
    book: Book;
    canDelete?: boolean;
    canShelve?: boolean;
    customShelves?: { id: string; name: string }[];
  }>(),
  { canDelete: false, canShelve: false, customShelves: () => [] },
);
const emit = defineEmits<{ delete: [id: string]; shelved: [] }>();

const SHELF_LABEL: Record<string, string> = {
  to_read: "To read",
  reading: "Reading",
  finished: "Finished",
};
</script>

<template>
  <article
    class="group flex flex-col rounded-xl border border-white/10 bg-slate-900/40 p-5 transition hover:border-teal-400/30 hover:bg-slate-900/70"
  >
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-xl font-semibold leading-snug text-slate-50">{{ book.title }}</h2>

      <span
        v-if="book.shelfKind && SHELF_LABEL[book.shelfKind]"
        class="shrink-0 rounded-full bg-teal-400/15 px-2.5 py-1 text-xs font-medium text-teal-200"
      >
        {{ SHELF_LABEL[book.shelfKind] }}
      </span>

      <button
        v-else-if="canDelete"
        class="shrink-0 cursor-pointer rounded-md px-2 text-lg leading-none text-slate-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
        aria-label="Delete book"
        @click="emit('delete', book.id)"
      >
        ×
      </button>
    </div>

    <p class="mt-1.5 text-base text-slate-400">
      {{ book.author }}<span v-if="book.year"> · {{ book.year }}</span>
      <span v-if="book.pages"> · {{ book.pages }} p.</span>
    </p>

    <div v-if="book.genres.length" class="mt-3 flex flex-wrap gap-1.5">
      <span
        v-for="genre in book.genres"
        :key="genre.id"
        class="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400"
      >
        {{ genre.name }}
      </span>
    </div>

    <div class="mt-auto pt-4 text-xs text-slate-600">
      <span v-if="book.isbn" class="font-mono">{{ book.isbn }}</span>
      <span v-if="book.isbn && book.ownerName"> · </span>
      <span v-if="canDelete">added by you</span>
      <span v-else-if="book.ownerName">added by {{ book.ownerName }}</span>
    </div>

    <ShelfPicker
      v-if="canShelve"
      :book-id="book.id"
      :current="book.shelfKind"
      :custom-shelves="customShelves"
      :member-of="book.customShelfIds"
      @changed="emit('shelved')"
    />
  </article>
</template>
