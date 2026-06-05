import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Password hashing using Argon2id with conservative cost parameters.
 * Argon2id is the OWASP-recommended default for password storage.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
