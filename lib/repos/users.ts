import { db } from '@/lib/db';

export type UserProfile = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

export async function upsertUser(user: UserProfile) {
  const { id, email = null, firstName = null, lastName = null, imageUrl = null } = user;

  await db.execute({
    sql: `
      INSERT INTO users (id, email, first_name, last_name, image_url)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = COALESCE(excluded.email, users.email),
        first_name = COALESCE(excluded.first_name, users.first_name),
        last_name = COALESCE(excluded.last_name, users.last_name),
        image_url = COALESCE(excluded.image_url, users.image_url)
    `,
    args: [id, email, firstName, lastName, imageUrl],
  });
}
