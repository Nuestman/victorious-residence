"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { slugify } from "@/lib/slug";
import { parseMediaUrl } from "@/lib/media-url";
import { ADMIN_RESIDENCE_COOKIE } from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { auditLogs, residenceMedia, residences } from "@/server/db/schema";
import { revalidatePublicShowcase } from "@/server/revalidate-public";

export type ResidenceActionState = {
  error?: string;
  success?: string;
};

const residenceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  address: z.string().trim().min(3).max(240),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(80).optional(),
  email: z.string().trim().max(120).optional(),
  heroImageUrl: z.string().trim().max(500).optional(),
});

async function writeAudit(
  actorId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType: "residence",
    entityId,
    metadata,
  });
}

function revalidateResidencePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/residences");
  revalidatePath("/admin/room-types");
  revalidatePath("/admin/provision");
  revalidatePath("/admin/occupancy");
  revalidatePath("/admin/staff");
  revalidatePath("/");
  revalidatePath("/resident");
  revalidatePublicShowcase();
}

function readResidenceContact(
  email: string | undefined,
  heroImageUrl: string | undefined,
) {
  const hero = parseMediaUrl(heroImageUrl ?? "");
  if (hero === "invalid") {
    return {
      error:
        "Hero image must be a site path starting with / or an http(s) URL.",
    } as const;
  }

  const trimmedEmail = email?.trim() ?? "";
  if (trimmedEmail && !z.string().email().safeParse(trimmedEmail).success) {
    return { error: "Enter a valid email." } as const;
  }

  return {
    email: trimmedEmail || null,
    heroImageUrl: hero,
  } as const;
}

export async function setAdminWorkingResidenceAction(formData: FormData) {
  const session = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get("residenceId"));
  if (!id.success) {
    return;
  }

  const [exists] = await db
    .select({ id: residences.id })
    .from(residences)
    .where(eq(residences.id, id.data))
    .limit(1);

  if (!exists) {
    return;
  }

  const jar = await cookies();
  jar.set(ADMIN_RESIDENCE_COOKIE, id.data, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  await writeAudit(
    session.user.id,
    "admin.residence_switch",
    exists.id,
    { residenceId: exists.id },
  );

  revalidateResidencePaths();
}

export async function createResidenceAction(
  _prev: ResidenceActionState,
  formData: FormData,
): Promise<ResidenceActionState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const parsed = residenceSchema.safeParse({
    name,
    slug: slugRaw || slugify(name),
    address: formData.get("address"),
    description: formData.get("description") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    heroImageUrl: formData.get("heroImageUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid residence." };
  }

  const contact = readResidenceContact(parsed.data.email, parsed.data.heroImageUrl);
  if ("error" in contact) {
    return { error: contact.error };
  }

  try {
    const [created] = await db
      .insert(residences)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        address: parsed.data.address,
        description: parsed.data.description || null,
        phone: parsed.data.phone || null,
        email: contact.email,
        heroImageUrl: contact.heroImageUrl,
        isActive: true,
      })
      .returning({ id: residences.id, name: residences.name });

    await writeAudit(session.user.id, "residence.create", created.id, parsed.data);

    const jar = await cookies();
    jar.set(ADMIN_RESIDENCE_COOKIE, created.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidateResidencePaths();
    return { success: `Created residence “${created.name}”.` };
  } catch {
    return {
      error: "Could not create residence. The slug may already be in use.",
    };
  }
}

export async function updateResidenceAction(
  _prev: ResidenceActionState,
  formData: FormData,
): Promise<ResidenceActionState> {
  const session = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) {
    return { error: "Invalid residence id." };
  }

  const name = String(formData.get("name") ?? "");
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const parsed = residenceSchema
    .extend({
      isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true"),
    })
    .safeParse({
      name,
      slug: slugRaw || slugify(name),
      address: formData.get("address"),
      description: formData.get("description") || undefined,
      phone: formData.get("phone") || undefined,
      email: formData.get("email") || undefined,
      heroImageUrl: formData.get("heroImageUrl") || undefined,
      isActive: formData.get("isActive") ?? "true",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid residence." };
  }

  const contact = readResidenceContact(parsed.data.email, parsed.data.heroImageUrl);
  if ("error" in contact) {
    return { error: contact.error };
  }

  try {
    const [updated] = await db
      .update(residences)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        address: parsed.data.address,
        description: parsed.data.description || null,
        phone: parsed.data.phone || null,
        email: contact.email,
        heroImageUrl: contact.heroImageUrl,
        isActive: parsed.data.isActive,
      })
      .where(eq(residences.id, id.data))
      .returning({ id: residences.id, name: residences.name });

    if (!updated) {
      return { error: "Residence not found." };
    }

    await writeAudit(session.user.id, "residence.update", updated.id, parsed.data);
    revalidateResidencePaths();
    return { success: `Updated “${updated.name}”.` };
  } catch {
    return {
      error: "Could not update residence. The slug may already be in use.",
    };
  }
}

const mediaKindSchema = z.enum(["EXTERIOR", "FACILITY"]);

export async function updateShowcaseMediaAction(
  _prev: ResidenceActionState,
  formData: FormData,
): Promise<ResidenceActionState> {
  const session = await requireAdmin();
  const residenceId = z.string().uuid().safeParse(formData.get("residenceId"));
  if (!residenceId.success) {
    return { error: "Invalid residence id." };
  }

  const ids = formData.getAll("mediaId").map(String);
  const kinds = formData.getAll("mediaKind").map(String);
  const titles = formData.getAll("mediaTitle").map(String);
  const descriptions = formData.getAll("mediaDescription").map(String);
  const urls = formData.getAll("mediaUrl").map(String);
  const captions = formData.getAll("mediaCaption").map(String);
  const deleted = new Set(formData.getAll("mediaDelete").map(String));

  if (
    ids.length !== kinds.length ||
    ids.length !== titles.length ||
    ids.length !== descriptions.length ||
    ids.length !== urls.length ||
    ids.length !== captions.length
  ) {
    return { error: "Showcase media form is incomplete." };
  }

  try {
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index]?.trim() ?? "";
      const remove = id.length > 0 && deleted.has(id);
      if (remove) {
        await db
          .delete(residenceMedia)
          .where(
            and(
              eq(residenceMedia.id, id),
              eq(residenceMedia.residenceId, residenceId.data),
            ),
          );
        continue;
      }

      const url = parseMediaUrl(urls[index]);
      if (url === "invalid") {
        return {
          error:
            "Each photo must be a site path starting with / or an http(s) URL.",
        };
      }
      if (!url) {
        if (id) {
          return { error: "A saved photo needs a URL, or mark it for removal." };
        }
        continue;
      }

      const kind = mediaKindSchema.safeParse(kinds[index]);
      if (!kind.success) {
        return { error: "Choose exterior or facility for each photo." };
      }

      const title = titles[index]?.trim() ?? "";
      if (title.length < 2) {
        return { error: "Each photo needs a short title." };
      }

      const values = {
        kind: kind.data,
        title,
        description: descriptions[index]?.trim() || null,
        url,
        caption: captions[index]?.trim() || null,
        sortOrder: index,
      };

      if (id) {
        await db
          .update(residenceMedia)
          .set(values)
          .where(
            and(
              eq(residenceMedia.id, id),
              eq(residenceMedia.residenceId, residenceId.data),
            ),
          );
      } else {
        await db.insert(residenceMedia).values({
          residenceId: residenceId.data,
          ...values,
        });
      }
    }

    await writeAudit(session.user.id, "residence.media", residenceId.data, {
      rows: ids.length,
    });
    revalidateResidencePaths();
    return { success: "Updated showcase photos." };
  } catch {
    return { error: "Could not save showcase photos." };
  }
}
