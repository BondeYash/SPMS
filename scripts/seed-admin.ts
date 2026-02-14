import "dotenv/config";
import { AppDataSource } from "../src/config/data-source";
import { AuthService } from "../src/services/AuthService";
import { Worker } from "../src/entities/Worker";

async function seed() {
    // Read email from env or default
    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    // Force password and name as requested
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin1234";
    const name = process.env.SEED_ADMIN_NAME || "Yash";

    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(Worker);

        // Delete any existing admin with this email first (per request)
        const existing = await repo.findOneBy({ email });
        if (existing) {
            console.log(`Deleting existing admin with email ${email} (id=${existing.id})`);
            await repo.delete({ email });
        }

        const auth = new AuthService();
        const created = await auth.registerWorker({ name, email, password, role: "admin" });
        console.log("Admin created:", { id: created.id, email: created.email, name: created.name });
        process.exit(0);
    } catch (err: any) {
        console.error("Failed to seed admin:", err?.message || err);
        process.exit(1);
    }
}

seed();
