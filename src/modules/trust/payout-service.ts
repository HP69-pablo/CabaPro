import { prisma } from "@/lib/prisma";
import { encryptSensitiveData, decryptSensitiveData } from "@/lib/crypto";
import { PayoutAccountType, IdDocumentType } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export interface CreatePayoutAccountInput {
  userId: string;
  type: PayoutAccountType;
  accountHolderName: string;
  details: Record<string, any>; // e.g. { iban: "...", swift: "...", baridiMobRip: "..." }
  isDefault?: boolean;
}

export interface DecryptedPayoutAccount {
  id: string;
  type: PayoutAccountType;
  accountHolderName: string;
  details: Record<string, any>;
  maskedIdentifier: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export class PayoutService {
  /**
   * Create a new payout receiving account with AES-256-GCM encryption at rest.
   */
  static async createPayoutAccount(input: CreatePayoutAccountInput) {
    const serializedDetails = JSON.stringify(input.details);
    const encryptedDetails = encryptSensitiveData(serializedDetails);

    if (input.isDefault) {
      // Remove default status from existing accounts
      await prisma.payoutAccount.updateMany({
        where: { userId: input.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.payoutAccount.create({
      data: {
        userId: input.userId,
        type: input.type,
        accountHolderName: input.accountHolderName.trim(),
        encryptedDetails,
        isDefault: input.isDefault ?? false,
      },
    });
  }

  /**
   * List payout accounts for user, safely decrypting details.
   */
  static async listUserPayoutAccounts(userId: string): Promise<DecryptedPayoutAccount[]> {
    const accounts = await prisma.payoutAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return accounts.map((acc) => {
      let details: Record<string, any> = {};
      try {
        const decryptedJson = decryptSensitiveData(acc.encryptedDetails);
        details = JSON.parse(decryptedJson);
      } catch {
        details = { error: "Failed to decrypt details" };
      }

      // Generate a masked identifier for secure UI display (e.g. DZ...4567 or ****1234)
      const rawIdentifier = details.iban || details.rip || details.cardNumber || details.accountNumber || "";
      const maskedIdentifier =
        rawIdentifier.length > 4
          ? `${rawIdentifier.slice(0, 2)}••••${rawIdentifier.slice(-4)}`
          : "••••";

      return {
        id: acc.id,
        type: acc.type,
        accountHolderName: acc.accountHolderName,
        details,
        maskedIdentifier,
        isDefault: acc.isDefault,
        isVerified: acc.isVerified,
        createdAt: acc.createdAt,
      };
    });
  }

  /**
   * Submit an Identity Verification request.
   */
  static async submitIdentityVerification(input: {
    userId: string;
    documentType: IdDocumentType;
    documentFrontKey: string;
    documentBackKey?: string;
    selfieKey: string;
  }) {
    return prisma.identityVerification.create({
      data: {
        userId: input.userId,
        documentType: input.documentType,
        documentFrontKey: input.documentFrontKey,
        documentBackKey: input.documentBackKey,
        selfieKey: input.selfieKey,
        status: "PENDING",
      },
    });
  }
}
