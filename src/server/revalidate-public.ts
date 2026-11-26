import { revalidatePath } from "next/cache";

export function revalidatePublicShowcase(roomTypeId?: string) {
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/facilities");
  revalidatePath("/gallery");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/resident");

  if (roomTypeId) {
    revalidatePath(`/rooms/${roomTypeId}`);
    revalidatePath(`/resident/room-types/${roomTypeId}`);
  }
}
