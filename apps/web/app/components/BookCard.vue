<script setup lang="ts">
import type { Book } from "@library/contracts";

withDefaults(defineProps<{ book: Book; canDelete?: boolean }>(), { canDelete: false });
const emit = defineEmits<{ delete: [id: string] }>();
</script>

<template>
  <div
    class="group relative rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
  >
    <button
      v-if="canDelete"
      @click="emit('delete', book.id)"
      class="absolute right-3 top-3 cursor-pointer rounded-md p-1 text-slate-500 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100"
      aria-label="Delete book"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
    <p v-if="book.isbn" class="mt-2 font-mono text-xs text-slate-500">ISBN {{ book.isbn }}</p>

    <div class="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
      <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
        :class="canDelete ? 'bg-sky-400/20 text-sky-300' : 'bg-white/10 text-slate-400'"
      >
        {{ book.ownerName ? book.ownerName.charAt(0).toUpperCase() : "—" }}
      </span>
      <span class="text-xs text-slate-500">
        <template v-if="canDelete">Added by you</template>
        <template v-else-if="book.ownerName">Added by {{ book.ownerName }}</template>
        <template v-else>From the seed catalogue</template>
      </span>
    </div>
  </div>
</template>
