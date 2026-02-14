import "dotenv/config";
import { AppDataSource } from "../src/config/data-source";
import { Worker } from "../src/entities/Worker";
import { customAlphabet } from "nanoid";

async function run() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Worker);
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    const nano = customAlphabet(alphabet, 6);

    const workers = await repo.find();
    for (const w of workers) {
        if ((w as any).shortId) continue;
        let code = nano();
        let tries = 0;
        while (await repo.findOneBy({ shortId: code })) {
            code = nano();
            tries++;
            if (tries > 10) break;
        }
        (w as any).shortId = code;
        await repo.save(w);
        console.log(`Set shortId for ${w.email} => ${code}`);
    }
    console.log("Backfill complete");
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
