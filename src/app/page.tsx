import { connection } from "next/server";
import { getState } from "@/lib/db";
import { StoreProvider } from "@/components/store";
import { AppShell } from "@/components/app-shell";

export default async function Home() {
  // Always render with fresh data from the store.
  await connection();
  const { todos, lists } = await getState();

  return (
    <StoreProvider initialTodos={todos} initialLists={lists}>
      <AppShell />
    </StoreProvider>
  );
}
