// lib/gocardless.ts
// GoCardless API Integration für SEPA-Lastschrift

const gocardless = require('gocardless-nodejs')
const constants = require('gocardless-nodejs/constants')

// Lazy initialization to avoid startup errors if env vars are missing
let _gocardlessClient: any = null

export function getGocardlessClient() {
  if (!_gocardlessClient) {
    if (!process.env.GOCARDLESS_ACCESS_TOKEN) {
      throw new Error('GOCARDLESS_ACCESS_TOKEN is not configured')
    }
    
    const environment = process.env.GOCARDLESS_ENVIRONMENT === 'live' 
      ? constants.Environments.Live 
      : constants.Environments.Sandbox
    
    _gocardlessClient = gocardless(
      process.env.GOCARDLESS_ACCESS_TOKEN,
      environment
    )
  }
  return _gocardlessClient
}

/**
 * Create GoCardless Customer
 */
export async function createGoCardlessCustomer(data: {
  email: string
  firstName: string
  lastName: string
  companyName?: string
  addressLine1?: string
  city?: string
  postalCode?: string
  countryCode?: string
}) {
  try {
    const customer = await getGocardlessClient().customers.create({
      email: data.email,
      given_name: data.firstName,
      family_name: data.lastName,
      company_name: data.companyName,
      address_line1: data.addressLine1,
      city: data.city,
      postal_code: data.postalCode,
      country_code: data.countryCode || 'DE', // Deutschland
      language: 'de',
      metadata: {
        platform: 'bereifung24'
      }
    })

    return customer
  } catch (error) {
    console.error('GoCardless Customer Creation Error:', error)
    throw error
  }
}

/**
 * Create Customer Bank Account
 */
export async function createCustomerBankAccount(data: {
  customerId: string
  accountHolderName: string
  iban: string
  countryCode?: string
}) {
  try {
    const bankAccount = await getGocardlessClient().customerBankAccounts.create({
      account_holder_name: data.accountHolderName,
      iban: data.iban,
      country_code: data.countryCode || 'DE',
      links: {
        customer: data.customerId
      },
      metadata: {
        platform: 'bereifung24'
      }
    })

    return bankAccount
  } catch (error) {
    console.error('GoCardless Bank Account Creation Error:', error)
    throw error
  }
}

/**
 * Create SEPA Mandate
 */
export async function createMandate(data: {
  customerId: string
  bankAccountId: string
  reference: string
}) {
  try {
    const mandate = await getGocardlessClient().mandates.create({
      links: {
        customer: data.customerId,
        customer_bank_account: data.bankAccountId
      },
      reference: data.reference,
      scheme: 'sepa_core', // SEPA Core Direct Debit
      metadata: {
        platform: 'bereifung24'
      }
    })

    return mandate
  } catch (error) {
    console.error('GoCardless Mandate Creation Error:', error)
    throw error
  }
}

/**
 * Get Mandate Status
 */
export async function getMandateStatus(mandateId: string) {
  try {
    const mandate = await getGocardlessClient().mandates.find(mandateId)
    return mandate
  } catch (error) {
    console.error('GoCardless Get Mandate Error:', error)
    throw error
  }
}

/**
 * Create Payment
 */
export async function createPayment(data: {
  amount: number // in cents (Euro * 100)
  currency?: string
  mandateId: string
  description: string
  reference?: string
  chargeDate?: string // YYYY-MM-DD
  metadata?: Record<string, string>
}) {
  try {
    const payment = await getGocardlessClient().payments.create({
      amount: Math.round(data.amount), // Must be integer (cents)
      currency: data.currency || 'EUR',
      description: data.description,
      reference: data.reference,
      charge_date: data.chargeDate,
      links: {
        mandate: data.mandateId
      },
      metadata: {
        platform: 'bereifung24',
        ...data.metadata
      }
    })

    return payment
  } catch (error) {
    console.error('GoCardless Payment Creation Error:', error)
    throw error
  }
}

/**
 * Get Payment Status
 */
export async function getPaymentStatus(paymentId: string) {
  try {
    const payment = await getGocardlessClient().payments.find(paymentId)
    return payment
  } catch (error) {
    console.error('GoCardless Get Payment Error:', error)
    throw error
  }
}

/**
 * Cancel Payment (only if not yet submitted)
 */
export async function cancelPayment(paymentId: string) {
  try {
    const payment = await getGocardlessClient().payments.cancel(paymentId)
    return payment
  } catch (error) {
    console.error('GoCardless Cancel Payment Error:', error)
    throw error
  }
}

/**
 * Cancel Mandate
 */
export async function cancelMandate(mandateId: string) {
  try {
    const mandate = await getGocardlessClient().mandates.cancel(mandateId)
    return mandate
  } catch (error) {
    console.error('GoCardless Cancel Mandate Error:', error)
    throw error
  }
}

/**
 * Verify Webhook Signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return signature === expectedSignature
}

/**
 * Get Redirect Flow (for Authorization UI)
 */
export async function createRedirectFlow(data: {
  sessionToken: string
  successRedirectUrl: string
  description?: string
  prefillCustomer?: {
    email?: string
    givenName?: string
    familyName?: string
    companyName?: string
  }
}) {
  try {
    const createData: any = {
      session_token: data.sessionToken,
      success_redirect_url: data.successRedirectUrl,
      scheme: 'sepa_core'
    }

    if (data.description) {
      createData.description = data.description
    }

    if (data.prefillCustomer) {
      createData.prefilled_customer = {
        email: data.prefillCustomer.email,
        given_name: data.prefillCustomer.givenName,
        family_name: data.prefillCustomer.familyName,
        company_name: data.prefillCustomer.companyName
      }
    }

    const redirectFlow = await getGocardlessClient().redirectFlows.create(createData)

    return redirectFlow
  } catch (error) {
    console.error('GoCardless Redirect Flow Creation Error:', error)
    throw error
  }
}

/**
 * Complete Redirect Flow (after customer returns)
 */
export async function completeRedirectFlow(
  redirectFlowId: string,
  sessionToken: string
) {
  try {
    const redirectFlow = await getGocardlessClient().redirectFlows.complete(
      redirectFlowId,
      { session_token: sessionToken }
    )

    return redirectFlow
  } catch (error) {
    console.error('GoCardless Complete Redirect Flow Error:', error)
    throw error
  }
}

/**
 * Calculate Commission with Tax
 */
export function calculateCommission(orderTotal: number, rate: number = 4.9) {
  const commissionGross = orderTotal * (rate / 100)
  const taxRate = 19.0 // 19% MwSt
  const commissionNet = commissionGross / (1 + taxRate / 100)
  const taxAmount = commissionGross - commissionNet

  return {
    orderTotal,
    commissionRate: rate,
    commissionGross: Math.round(commissionGross * 100) / 100,
    commissionNet: Math.round(commissionNet * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxRate
  }
}

/**
 * Generate Invoice Number
 */
export function generateInvoiceNumber(year: number, month: number, sequence: number): string {
  const paddedMonth = month.toString().padStart(2, '0')
  const paddedSequence = sequence.toString().padStart(4, '0')
  return `RE-${year}-${paddedMonth}-${paddedSequence}`
}

/**
 * Format amount for GoCardless (cents)
 */
export function formatAmountForGoCardless(euros: number): number {
  return Math.round(euros * 100)
}
