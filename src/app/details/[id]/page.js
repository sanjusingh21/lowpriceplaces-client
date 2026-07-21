import DetailsClient from "./DetailsClient";
import { api } from "@/api";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const listing = await api.getListingDetails(id);
    const photos = listing.imagePath ? listing.imagePath.split(",") : [];
    const coverImage = photos[0] || "";
    const imageServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

    return {
      title: `${listing.title} | lowpriceplaces`,
      description: listing.description,
      openGraph: {
        title: listing.title,
        description: listing.description,
        images: coverImage ? [`${imageServer}${coverImage}`] : [],
      },
    };
  } catch (e) {
    return {
      title: "Product Details | lowpriceplaces",
      description: "Discover budget-friendly products locally.",
    };
  }
}

export default async function Page({ params }) {
  const { id } = await params;
  return <DetailsClient id={id} />;
}
