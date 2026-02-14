import "dotenv/config";
import { AppDataSource } from "../src/config/data-source";
import { AuthService } from "../src/services/AuthService";

async function test() {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin1234";

    try {
        await AppDataSource.initialize();
        const auth = new AuthService();
        const res = await auth.authenticate(email, password);
        console.log("Authentication success:", res.user);
        process.exit(0);
    } catch (err: any) {
        console.error("Authentication failed:", err?.message || err);
        process.exit(1);
    }
}

test();
