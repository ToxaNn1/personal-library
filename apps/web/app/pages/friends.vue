<script setup lang="ts">
const { $orpc, $auth } = useNuxtApp();
const session = $auth.useSession();
const userId = computed(() => session.value.data?.user.id ?? null);

const error = ref<string | null>(null);
const busy = ref<string | null>(null);

const { data: peopleData, refresh: refreshPeople } = await useAsyncData(
  "people",
  () => (userId.value ? $orpc.listPeople() : Promise.resolve([])),
  { watch: [userId] },
);
const people = computed(() => peopleData.value ?? []);

const { data: feedData, refresh: refreshFeed } = await useAsyncData(
  "feed",
  () => (userId.value ? $orpc.friendsReading() : Promise.resolve([])),
  { watch: [userId] },
);
const feed = computed(() => feedData.value ?? []);

const { data: notificationsData, refresh: refreshNotifications } = await useAsyncData(
  "notifications",
  () => (userId.value ? $orpc.listNotifications() : Promise.resolve([])),
  { watch: [userId] },
);
const notifications = computed(() => notificationsData.value ?? []);
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);

async function markRead(id: string) {
  try {
    await $orpc.markNotificationRead({ id });
    await refreshNotifications();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Something went wrong";
  }
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString();
}

async function toggleFollow(id: string, isFollowing: boolean) {
  busy.value = id;
  error.value = null;
  try {
    if (isFollowing) {
      await $orpc.unfollowUser({ userId: id });
    } else {
      await $orpc.followUser({ userId: id });
    }
    await Promise.all([refreshPeople(), refreshFeed(), refreshNotifications()]);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Something went wrong";
  } finally {
    busy.value = null;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
    <div class="px-8 py-12 lg:px-12">
      <header class="mb-10">
        <NuxtLink to="/" class="text-base text-slate-400 transition hover:text-slate-200">
          ← Back to the catalogue
        </NuxtLink>
        <h1 class="mt-3 text-4xl font-bold tracking-tight text-teal-300 sm:text-5xl">Friends</h1>
      </header>

      <p v-if="!userId" class="rounded-xl border border-white/10 bg-white/5 p-5 text-slate-300">
        Sign in to follow other readers.
      </p>

      <template v-else>
        <p
          v-if="error"
          class="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-base text-rose-200"
        >
          {{ error }}
        </p>

        <section class="mb-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 class="mb-4 text-base font-semibold uppercase tracking-wide text-slate-400">
            Notifications
            <span
              v-if="unreadCount"
              class="ml-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-teal-300"
            >
              {{ unreadCount }} new
            </span>
          </h2>

          <p v-if="!notifications.length" class="text-base text-slate-500">Nothing here yet.</p>

          <ul v-else class="space-y-2">
            <li
              v-for="note in notifications"
              :key="note.id"
              class="flex items-start justify-between gap-3 rounded-lg border border-white/5 px-4 py-3"
              :class="note.read ? 'bg-slate-900/20' : 'bg-slate-900/60'"
            >
              <div>
                <p class="text-base" :class="note.read ? 'text-slate-400' : 'text-slate-100'">
                  {{ note.title }}
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  {{ note.body }} · {{ formatWhen(note.createdAt) }}
                </p>
              </div>
              <button
                v-if="!note.read"
                type="button"
                class="shrink-0 text-sm text-slate-400 transition hover:text-slate-100"
                @click="markRead(note.id)"
              >
                Mark read
              </button>
            </li>
          </ul>
        </section>

        <section class="mb-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 class="mb-4 text-base font-semibold uppercase tracking-wide text-slate-400">
            Currently reading
          </h2>

          <p v-if="!feed.length" class="text-base text-slate-500">
            Nothing yet — follow someone below to fill this feed.
          </p>

          <ul v-else class="space-y-3">
            <li
              v-for="item in feed"
              :key="`${item.userId}-${item.bookId}`"
              class="rounded-lg border border-white/5 bg-slate-900/40 px-4 py-3"
            >
              <p class="text-base text-slate-100">
                <span class="font-medium text-teal-300">{{ item.userName }}</span>
                is reading
                <span class="font-medium">{{ item.title }}</span>
              </p>
              <p class="mt-1 text-sm text-slate-500">
                {{ item.author }} · since {{ formatDate(item.startedAt) }}
              </p>
            </li>
          </ul>
        </section>

        <section class="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 class="mb-4 text-base font-semibold uppercase tracking-wide text-slate-400">
            Readers
          </h2>

          <p v-if="!people.length" class="text-base text-slate-500">
            No one else has signed up yet.
          </p>

          <ul v-else class="space-y-2">
            <li
              v-for="person in people"
              :key="person.id"
              class="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-4 py-3"
            >
              <div>
                <p class="text-base font-medium text-slate-100">{{ person.name }}</p>
                <p class="text-sm text-slate-500">{{ person.booksFinished }} finished</p>
              </div>
              <button
                type="button"
                :disabled="busy === person.id"
                class="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                @click="toggleFollow(person.id, person.isFollowing)"
              >
                {{ person.isFollowing ? "Unfollow" : "Follow" }}
              </button>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </main>
</template>
