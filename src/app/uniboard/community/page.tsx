import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Community",
  description: "Community feed and discovery",
};

/** Community is not live yet — keep the route from breaking builds; nav stays hidden. */
export default function CommunityPage() {
  redirect("/uniboard/resume");
}
