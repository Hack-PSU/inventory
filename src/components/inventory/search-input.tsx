import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput(props: any) {
	return (
		<div className="relative">
			<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input type="search" className="pl-8 sm:w-[300px]" {...props} />
		</div>
	);
}
