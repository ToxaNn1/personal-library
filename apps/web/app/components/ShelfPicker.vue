<script setup lang="ts">
import type { ShelfKind, StatusShelfKind } from "@library/contracts";

const props = withDefaults(
  defineProps<{
    bookId: string;
    current: ShelfKind | null;
    customShelves?: { id: string; name: string }[];
    memberOf?: string[];
  }>(),
  { customShelves: () => [], memberOf: () => [] },
);
const emit = defineEmits<{ changed: [] }>();

const { $orpc } = useNuxtApp();

const OPTIONS: { kind: StatusShelfKind; label: string }[] = [
  { kind: "to_read", label: "To read" },
  { kind: "reading", label: "Reading" },
  { kind: "finished", label: "Finished" },
];

const busy = ref(false);
const pending = ref<string | null>(null);
const error = ref<string | null>(null);
const reviewing = ref(false);
const rating = ref(5);
const body = ref("");

async function place(kind: StatusShelfKind) {
  if (kind === "finished") {
    reviewing.value = true;
    return;
  }
  await run(async () => {
    await $orpc.placeBookOnShelf({ bookId: props.bookId, kind });
  });
}

async function remove() {
  await run(async () => {
    await $orpc.removeBookFromShelves({ bookId: props.bookId });
  });
}

async function toggleCustom(shelfId: string) {
  pending.value = shelfId;
  await run(async () => {
    if (props.memberOf.includes(shelfId)) {
      await $orpc.removeBookFromShelf({ shelfId, bookId: props.bookId });
    } else {
      await $orpc.addBookToShelf({ shelfId, bookId: props.bookId });
    }
  });
  pending.value = null;
}

async function finish() {
  await run(async () => {
    await $orpc.finishAndReview({
      bookId: props.bookId,
      rating: rating.value,
      body: body.value.trim() || undefined,
    });
    reviewing.value = false;
    body.value = "";
  });
}

async function run(action: () => Promise<void>) {
  busy.value = true;
  error.value = null;
  try {
    await action();
    emit("changed");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Something went wrong";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="mt-5 space-y-3 border-t border-white/10 pt-4">
    <div class="flex items-center gap-2">
      <div class="inline-flex rounded-lg border border-white/10 bg-slate-950/60 p-1">
        <button
          v-for="option in OPTIONS"
          :key="option.kind"
          :disabled="busy"
          class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-40"
          :class="
            current === option.kind
              ? 'bg-teal-400 text-slate-950'
              : 'text-slate-400 hover:text-slate-100'
          "
          @click="place(option.kind)"
        >
          {{ option.label }}
        </button>
      </div>

      <button
        v-if="current"
        :disabled="busy"
        class="cursor-pointer text-sm text-slate-500 transition hover:text-rose-300"
        @click="remove"
      >
        Clear
      </button>
    </div>

    <div v-if="customShelves.length" class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="shelf in customShelves"
        :key="shelf.id"
        :disabled="busy"
        class="cursor-pointer rounded-full border px-3 py-1 text-sm transition disabled:cursor-wait"
        :class="[
          memberOf.includes(shelf.id)
            ? 'border-teal-400/60 bg-teal-400/15 text-teal-200'
            : 'border-white/10 text-slate-400 hover:border-teal-400/40 hover:text-teal-200',
          pending === shelf.id ? 'opacity-50' : '',
        ]"
        @click="toggleCustom(shelf.id)"
      >
        <span class="mr-1 inline-block w-2.5 text-center text-teal-300">
          {{ memberOf.includes(shelf.id) ? "✓" : "+" }}
        </span>
        {{ shelf.name }}
      </button>
    </div>

    <div v-if="reviewing" class="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <p class="mb-3 text-sm text-slate-400">Finishing a book requires a review.</p>
      <div class="flex items-center gap-1">
        <button
          v-for="n in 5"
          :key="n"
          class="cursor-pointer text-2xl leading-none transition"
          :class="n <= rating ? 'text-teal-300' : 'text-slate-700 hover:text-slate-500'"
          @click="rating = n"
        >
          ★
        </button>
        <span class="ml-2 text-sm text-slate-500">{{ rating }}/5</span>
      </div>
      <textarea
        v-model="body"
        rows="2"
        placeholder="What did you think?"
        class="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-base text-slate-100 placeholder:text-slate-600 focus:border-teal-400 focus:outline-none"
      />
      <div class="mt-3 flex gap-2">
        <button
          :disabled="busy"
          class="cursor-pointer rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-50"
          @click="finish"
        >
          {{ busy ? "Saving…" : "Finish & review" }}
        </button>
        <button
          class="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-slate-100"
          @click="reviewing = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <p v-if="error" class="text-sm text-rose-300">{{ error }}</p>
  </div>
</template>
