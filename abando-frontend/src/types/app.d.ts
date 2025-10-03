export type AppPageProps = {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<URLSearchParams | Record<string, string | undefined>>;
};
