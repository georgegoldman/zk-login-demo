/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SuiClient } from '@mysten/sui/client';
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getZkLoginSignature,
  jwtToAddress,
} from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin';
import { Transaction } from '@mysten/sui/transactions';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '@mysten/sui/dist/cjs/zklogin/jwt-decode';
import { SerializeSignatureInput } from '@mysten/sui/cryptography';
import { parsePartialSignatures } from '@mysten/sui/dist/cjs/multisig/publickey';
import axios from 'axios';

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>['0']['inputs'],
  'addressSeed'
>;

@Injectable()
export class ZkWorkingService implements OnModuleInit {
  private readonly FULLNODE_URL = 'https://fullnode.testnet.sui.io';
  private suiClient = new SuiClient({ url: this.FULLNODE_URL });
  private nonce: string;
  private ephemeralKeyPair: Ed25519Keypair;
  private randomness: string;
  private maxEpoch: number;

  constructor() {
    this.suiClient = new SuiClient({ url: this.FULLNODE_URL });
  }

  async onModuleInit() {
    try {
      const { epoch } = await this.suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;

      this.ephemeralKeyPair = new Ed25519Keypair();
      this.randomness = generateRandomness();
      this.nonce = generateNonce(
        this.ephemeralKeyPair.getPublicKey(),
        maxEpoch,
        this.randomness,
      );
    } catch (error) {
      console.error('Error initializing ZkWorkingService:', error);
    }
  }

  getNonce(): string {
    console.log(this.nonce);

    return this.nonce;
  }

  getUserAddress(): string {
    return jwtToAddress(
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlMTkzZDQ2NDdhYjRhMzU4NWFhOWIyYjNiNDg0YTg3YWE2OGJiNDIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDIzMTE1OTgxMzk3LTdkc2xzazMzY3FoOTR2aWdzOGhuZ2xhZnRoZ21vZ2ExLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTAyMzExNTk4MTM5Ny03ZHNsc2szM2NxaDk0dmlnczhobmdsYWZ0aGdtb2dhMS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMjgxNDI4MDQ4MTY3NDMyODkzNCIsImVtYWlsIjoicmFuc29tZXplNjU0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiNkpRRkdvU0ZqdWZ0MXJ1S3hPMUYxUSIsIm5hbWUiOiJFemUgUmFuc29tIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0paSU9iSGx6TEpVNFlPRHlUV2hwa2Y0UG02WGlZeTZHbE1TX2xiS3lSQXpzSmRwVDA1PXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkV6ZSIsImZhbWlseV9uYW1lIjoiUmFuc29tIiwiaWF0IjoxNzQyNTU1NDk4LCJleHAiOjE3NDI1NTkwOTh9.FtiIGGX4hXXyLDMF7WQqgnZsA4LTSCS1v9jFi8T9U_6VAPKm1uwV46nj5aWiftQEfKoKB4cnKAFQkvQMP52QATEOYEc_nzcNQQ6cFiGhrOkgp23TxDnZtkreESQukbleHENgWCjbj20xq8SzDN_9OEqmNWRtk00RQzgnWkqnHgXG5sn77OVZhswsHZVKqb15W-lWiKfdzc3bBs6UVVyy889LCWfIb82MKiW8xzvenl1HCx_os4HIg7e5u_LoV57MNlwtv79IZNkWa2RTSQEQJLpXUyx58aLXMR4GGLlSRx4JegH9-4-oChgxoQOc83jQFmjFPzc1jYZOcR4DvBdvEw',
      BigInt(this.generateUserSalt()),
    );
  }

  private generateUserSalt(): string {
    // Generate a numeric string that can be converted to BigInt
    return Math.floor(Math.random() * 1e18).toString(); // Example: "834729347239847234"
  }

  getZkProof(): string {
    return getExtendedEphemeralPublicKey(this.ephemeralKeyPair.getPublicKey());
  }

  decodeJwt(token: string): JwtPayload {
    return jwt.decode(token) as JwtPayload;
  }

  async signTransaction(token: string): Promise<any> {
    try {
      const client = this.suiClient;
      const txb = new Transaction();

      txb.setSender(
        '0x995f3437c50735b2fa7555481b4665e712c76d5bc99e6c94a5eb820be2788d4e',
      );

      // Build the transaction - this returns the serialized bytes directly
      const bytes = await txb.build({ client });

      // Sign the bytes directly with the ephemeral keypair
      console.log(bytes);
      const signature = await new Ed25519Keypair().sign(bytes);

      const jwtPayload = this.decodeJwt(token);

      const audience =
        typeof jwtPayload.aud === 'string'
          ? jwtPayload.aud
          : Array.isArray(jwtPayload.aud)
            ? jwtPayload.aud[0]
            : '';

      const addressSeed: string = genAddressSeed(
        BigInt(this.generateUserSalt()),
        'sub',
        jwtPayload.sub!,
        audience,
      ).toString();

      // Get partial ZK login signature
      const partialZkLoginSignature =
        await this.getPartialZkLoginSignature(token);

      // Use the stored maxEpoch value
      const maxEpoch = this.maxEpoch;

      // Generate complete ZK login signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...partialZkLoginSignature,
          addressSeed,
        },
        maxEpoch,
        userSignature: signature,
      });

      // Execute transaction with the ZK login signature
      return await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });
    } catch (error) {
      console.error('Error in signTransaction:', error);
      throw error;
    }
  }

  private async getPartialZkLoginSignature(
    token: string,
  ): Promise<PartialZkLoginSignature> {
    try {
      const keyPair = this.ephemeralKeyPair;
      console.log('KeyPair available:', !!keyPair);

      const publicKey = keyPair.getPublicKey();
      console.log('Public key:', publicKey);

      const extendedEphemeralPublicKey =
        getExtendedEphemeralPublicKey(publicKey);
      console.log('Extended ephemeral public key:', extendedEphemeralPublicKey);

      const maxEpoch = this.getMaxEpoch(token);
      console.log('Max epoch:', maxEpoch);

      const randomness = this.getRandomness(token);
      console.log('Randomness:', randomness);

      const salt = this.generateUserSalt();
      console.log('Salt:', salt);

      const verificationPayload = {
        jwt: token,
        extendedEphemeralPublicKey,
        maxEpoch,
        jwtRandomness: randomness,
        salt,
        keyClaimName: 'sub',
      };
      console.log('Verification payload:', JSON.stringify(verificationPayload));

      // Make request to the prover service
      const proofResponse = await axios.post(
        'https://prover-dev.mystenlabs.com/v1',
        verificationPayload,
        {
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      console.log('Proof response status:', proofResponse.status);
      console.log(
        'Proof response data:',
        JSON.stringify(proofResponse.data).substring(0, 100) + '...',
      );

      return proofResponse.data as PartialZkLoginSignature;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            data: error.config?.data
              ? JSON.stringify(error.config.data).substring(0, 100) + '...'
              : null,
          },
        });
      } else {
        console.error('Non-Axios error:', error);
      }
      throw new Error('Failed to get partial ZK login signature');
    }
  }
  private getMaxEpoch(token: string): number {
    console.log(`log max epoch ${this.maxEpoch}`);

    return this.maxEpoch;
  }

  private getRandomness(token): string {
    return this.randomness;
  }
}
