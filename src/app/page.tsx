import InventoryLayout from "./inventory/layout";
import CategoriesPage from "./inventory/categories/page";

export default function HomePage() {
	return (
		<InventoryLayout>
			<CategoriesPage />
		</InventoryLayout>
	);
}
