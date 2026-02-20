declare module 'pinata-web3' {
  export class PinataSDK {
    constructor(config: {
      pinataJwt: string;
      pinataGatewayKey?: string;
      pinataGatewaySecret?: string;
      pinataGateway?: string;
    });
    upload: {
      file(file: File, options?: object): Promise<{ cid: string; size: number; timestamp: string }>;
      json(
        json: object,
        options?: object
      ): Promise<{ cid: string; size: number; timestamp: string }>;
    };
    unpin(hashToUnpin: string): Promise<void>;
    testGateway: (url: string) => Promise<boolean>;
  }
}
