import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { HomeView } from "@/features/auth/components/home-view";

export const dynamic = "force-dynamic";

export default async function Home() {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		redirect(routes.chat);
	}

	return <HomeView />;
}
