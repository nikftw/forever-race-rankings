import { RaceBoard } from "@/components/race-board";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 md:px-6 md:py-6">
      <h1 className="sr-only">Race rankings</h1>
      <RaceBoard />
      <SiteFooter />
    </div>
  );
}
