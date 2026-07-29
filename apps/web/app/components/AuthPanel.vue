<script setup lang="ts">
const { $auth } = useNuxtApp();
const session = $auth.useSession();

const mode = ref<"sign-in" | "sign-up">("sign-in");
const form = reactive({ name: "", email: "", password: "" });
const isSubmitting = ref(false);
const error = ref<string | null>(null);

const emit = defineEmits<{ changed: [] }>();

async function submit() {
  isSubmitting.value = true;
  error.value = null;

  const result =
    mode.value === "sign-up"
      ? await $auth.signUp.email({ name: form.name, email: form.email, password: form.password })
      : await $auth.signIn.email({ email: form.email, password: form.password });

  isSubmitting.value = false;

  if (result.error) {
    error.value = result.error.message ?? "Authentication failed";
    return;
  }

  form.name = "";
  form.email = "";
  form.password = "";
  emit("changed");
}

async function signOut() {
  await $auth.signOut();
  emit("changed");
}
</script>

<template>
  <div class="mb-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
    <div v-if="session.data" class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-slate-300">
        Signed in as
        <span class="font-semibold text-slate-100">{{ session.data.user.email }}</span>
      </p>
      <button
        @click="signOut"
        class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
      >
        Sign out
      </button>
    </div>

    <form v-else @submit.prevent="submit" class="flex flex-wrap items-center gap-3">
      <input
        v-if="mode === 'sign-up'"
        v-model="form.name"
        required
        placeholder="Name"
        class="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
      />
      <input
        v-model="form.email"
        type="email"
        required
        placeholder="Email"
        class="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
      />
      <input
        v-model="form.password"
        type="password"
        required
        minlength="8"
        placeholder="Password (min 8)"
        class="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
      />
      <button
        type="submit"
        :disabled="isSubmitting"
        class="cursor-pointer rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ isSubmitting ? "…" : mode === "sign-up" ? "Sign up" : "Sign in" }}
      </button>
      <button
        type="button"
        @click="mode = mode === 'sign-in' ? 'sign-up' : 'sign-in'"
        class="cursor-pointer text-sm text-slate-400 underline-offset-4 transition hover:text-slate-200 hover:underline"
      >
        {{ mode === "sign-in" ? "Create account" : "Have an account?" }}
      </button>
    </form>

    <p v-if="error" class="mt-3 text-sm text-rose-300">{{ error }}</p>
  </div>
</template>
