import { createSolanaRpc,devnet,createKeyPairFromBytes,getBase58Codec,createSignerFromKeyPair,createKeyPairSignerFromBytes,generateKeyPairSigner} from "@solana/kit";
// import { generateKeyPairSigner } from '@solana/signers';
// import { FILE } from "node:dns";
import {readFile,writeFile} from "node:fs/promises" ;

const WALLET_FILE = "wallet.json";
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

async function loadOrCreateWallet() {
  try {
    const data = JSON.parse(await readFile(WALLET_FILE, "utf-8"));
    // console.log("Loaded wallet data from ", data);
    const secretBytes = new Uint8Array(data.secretKey);
    const wallet = await createKeyPairSignerFromBytes(secretBytes);
    console.log("Loaded existing wallet:", wallet.address);
    return wallet;
  } catch(error)  {
    console.log(
        "error",error.message
    )
      const wallet = await generateKeyPairSigner({extractable: true});
// Allow exporting the key pair for persistence
// const keyPair = await crypto.subtle.generateKey(
//     /* algorithm */ { name: 'Ed25519' },
//     /* extractable */ true,
//     /* usages */ ['sign', 'verify'],
// );

       
        // Export the keypair bytes so we can reload it later
      const pkcs8 = await crypto.subtle.exportKey(
      "pkcs8",
      wallet.keyPair.privateKey,
    );
    const privateKeyBytes = new Uint8Array(pkcs8, pkcs8.byteLength - 32, 32);
        
        const publicKeyBytes = new Uint8Array(
        await crypto.subtle.exportKey("raw", wallet.keyPair.publicKey)
        );

        // Solana keypair format: 64 bytes (32 private + 32 public)
        const keypairBytes = new Uint8Array(64);
        keypairBytes.set(privateKeyBytes, 0);
        keypairBytes.set(publicKeyBytes, 32);
        // const wallet = await createSignerFromKeyPair(keyPair);
        await writeFile(
        WALLET_FILE,
        JSON.stringify({ secretKey: Array.from(keypairBytes) })
        );

        console.log("Created new wallet:", wallet.address);
        console.log(`Saved to ${WALLET_FILE}`);
        return wallet;
  }
}

const wallet = await loadOrCreateWallet();

const { value: balance } = await rpc.getBalance(wallet.address).send();
const balanceInSol = Number(balance) / 1_000_000_000;
console.log(`\nAddress: ${wallet.address}`);
console.log(`Balance: ${balanceInSol} SOL`);

if (balanceInSol === 0) {
    console.log(`\nThis wallet has no SOL. Visite https://faucet.solana.com/ and airdrop some to:`);
    console.log(wallet.address);
}