<template>
  <v-container class="h-full flex items-center" max-width="900">
    <div>
      <v-img
        alt="Placeholder logo"
        class="mb-4"
        height="150"
        src="@/assets/logo.png"
      />

      <div class="mb-8 text-center">
        <div class="font-light">Welcome to</div>
        <h1 class="text-7xl font-heading my-0 font-medium">Vuetify</h1>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <v-card
          class="hero-card"
          color="surface-variant"
          image="https://cdn.vuetifyjs.com/docs/images/one/create/feature.png"
          rounded="xl"
          variant="tonal"
        >
          <template #prepend>
            <v-avatar class="ml-2 mr-4" icon="mdi-rocket-launch-outline" size="60" variant="tonal" />
          </template>

          <template #image>
            <v-img alt="Hero card supplemental image" class="hidden sm:block my-auto" height="120" position="top right" />
          </template>

          <template #title>
            <h2 class="text-2xl font-heading my-0 font-medium pt-1 translate-y-1">
              Get started
            </h2>
          </template>

          <template #subtitle>
            <div class="mt-2">
              Change this page by updating <v-code>components/HelloWorld.vue</v-code>.
            </div>
          </template>
        </v-card>

        <v-card
          v-for="link in links"
          :key="link.href"
          append-icon="mdi-arrow-top-right"
          class="feature-card"
          color="surface-variant"
          :href="link.href"
          rel="noopener noreferrer"
          rounded="xl"
          :subtitle="link.subtitle"
          target="_blank"
          :title="link.title"
          variant="tonal"
        >
          <template #prepend>
            <v-avatar class="ml-2 mr-4" :icon="link.icon" size="60" variant="tonal" />
          </template>
        </v-card>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
  const links = [
    {
      href: 'https://vuetifyjs.com/',
      icon: 'mdi-text',
      subtitle: 'Learn about all things Vuetify in our documentation.',
      title: 'Documentation',
    },
    {
      href: 'https://vuetifyjs.com/introduction/why-vuetify/#feature-guides',
      icon: 'mdi-star',
      subtitle: 'Explore available framework Features.',
      title: 'Features',
    },
    {
      href: 'https://vuetifyjs.com/components/all',
      icon: 'mdi-widgets-outline',
      subtitle: 'Discover components in the API Explorer.',
      title: 'Components',
    },
    {
      href: 'https://discord.vuetifyjs.com',
      icon: 'mdi-account-group-outline',
      subtitle: 'Connect with Vuetify developers.',
      title: 'Community',
    },
  ]
</script>

<style>
@reference "../styles/tailwind.css";

.v-card {
  @apply rounded-xl;
}

.hero-card {
  @apply md:col-span-2 md:py-4 sm:pr-[120px] w-full bg-primary-100 dark:bg-primary-900
}

.v-card-subtitle {
  @apply text-wrap line-clamp-2 leading-[1.2];
  --v-medium-emphasis-opacity: .8;
}

.feature-card {
  @apply flex items-center [&>.v-card-item]:w-full bg-secondary-100;
  @apply dark:bg-linear-to-r dark:from-secondary-800 dark:to-secondary-600 dark:text-white;

  .v-card-item {
    @apply self-stretch;
  }
  .v-card-item__content {
    @apply self-stretch py-2;
  }
}
</style>
