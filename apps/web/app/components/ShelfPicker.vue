<script setup lang="ts">
import type { ShelfKind, StatusShelfKind } from "@library/contracts";

const props = defineProps<{ bookId: string; current: ShelfKind | null }>();
const emit = defineEmits<{ changed: [] }>();

const { $orpc } = useNuxtApp();

const OPTIONS: { kind: StatusShelfKind; label: string }[] = [
  { kind: "to_read", label: "To read" },
  { kind: "reading", label: "Reading" },
  { kind: "finished", label: "Finished" },
];

const busy = ref(false);
const error = ref<string | null>(null);
const reviewing = ref(false);
const rating = ref(5);
const body = ref("");

async function place(kind: StatusShelfKind) {
  if (kind === "finished") {
    reviewing.value = true;
    return;
  }
  busy.value = true;
  error.value = null;
  try {
    await $orpc.placeBookOnShelf({ bookId: props.bookId, kind });
    emit("changed");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not move the book";
  } finally {
    busy.value = false;
  }
}

async function finish() {
  busy.value = true;
  error.value = null;
  try {
    await $orpc.finishAndReview({
      bookId: props.bookId,
      rating: rating.value,
      body: body.value.trim() || undefined,
    });
    reviewing.value = false;
    body.value = "";
    emit("changed");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not save the review";
  } finally {
    busy.value = false;
  }
}

async function remove() {
  busy.value = true;
  error.value = null;
  try {
    await $orpc.removeBookFromShelves({ bookId: props.bookId });
    emit("changed");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not remove the book";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="mt-3 border-t border-white/5 pt-3">
    <div class="flex flex-wrap items-center gap-1">
      <button
        v-for="option in OPTIONS"
        :key="option.kind"
        :disabled="busy"
        @click="place(option.kind)"
        class="cursor-pointer rounded-md px-2 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="
          current === option.kind
            ? 'bg-sky-400/20 font-medium text-sky-300'
            : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
        "
      >
        {{ option.label }}
      </button>
      <button
        v-if="current"
        :disabled="busy"
        @click="remove"
        class="ml-auto cursor-pointer rounded-md px-2 py-1 text-xs text-slate-500 transition hover:text-rose-300"
      >
        Remove
      </button>
    </div>

    <div v-if="reviewing" class="mt-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
      <p class="mb-2 text-xs text-slate-400">Finishing a book requires a review.</p>
      <div class="flex items-center gap-1">
        <button
          v-for="n in 5"
          :key="n"
          @click="rating = n"
          class="cursor-pointer text-lg leading-none transition"
          :class="n <= rating ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'"
        >
          ★
        </button>
        <span class="ml-1 text-xs text-slate-500">{{ rating }}/5</span>
      </div>
      <textarea
        v-model="body"
        rows="2"
        placeholder="What did you think?"
        class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
      />
      <div class="mt-2 flex gap-2">
        <button
          :disabled="busy"
          @click="finish"
          class="cursor-pointer rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {{ busy ? "Saving…" : "Finish & review" }}
        </button>
        <button
          @click="reviewing = false"
          class="cursor-pointer rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-2 text-xs text-rose-300">{{ error }}</p>
  </div>
</template>
