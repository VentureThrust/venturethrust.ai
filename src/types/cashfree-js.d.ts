// Type declarations for the Cashfree checkout SDK, which ships without its own
// types. Covers only the surface we use (load + checkout).
declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
  }
  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<unknown>;
  }
  export function load(options: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
