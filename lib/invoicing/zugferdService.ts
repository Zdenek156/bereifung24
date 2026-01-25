import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom'

/**
 * ZUGFeRD 2.2 Service
 * Generates EN 16931 compliant XML for E-Invoicing in Germany
 * Format: ZUGFeRD 2.2 (Factur-X EXTENDED profile)
 */

interface ZugferdInvoiceData {
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  billingPeriodStart: Date
  billingPeriodEnd: Date
  
  seller: {
    name: string
    address?: {
      street?: string
      city?: string
      zip?: string
      country?: string
    }
    taxNumber?: string
    email?: string
    phone?: string
  }
  
  buyer: {
    name: string
    email?: string
    phone?: string
  }
  
  lineItems: Array<{
    name: string
    quantity: number
    unitPrice: number
    netAmount: number
    vatRate: number
    vatAmount: number
  }>
  
  netTotal: number
  vatTotal: number
  grossTotal: number
}

/**
 * Generate ZUGFeRD 2.2 XML (EN 16931 compliant)
 * Profile: EXTENDED (suitable for B2B invoicing)
 */
export function generateZugferdXml(data: ZugferdInvoiceData): string {
  const doc = new DOMImplementation().createDocument(
    'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
    'rsm:CrossIndustryInvoice',
    null
  )
  
  const root = doc.documentElement
  root.setAttribute('xmlns:rsm', 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100')
  root.setAttribute('xmlns:qdt', 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100')
  root.setAttribute('xmlns:ram', 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100')
  root.setAttribute('xmlns:xs', 'http://www.w3.org/2001/XMLSchema')
  root.setAttribute('xmlns:udt', 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100')
  
  // ExchangedDocumentContext (Profile)
  const context = doc.createElementNS(root.namespaceURI, 'rsm:ExchangedDocumentContext')
  const guidelineContext = doc.createElementNS(root.namespaceURI, 'ram:GuidelineSpecifiedDocumentContextParameter')
  const guidelineId = doc.createElementNS(root.namespaceURI, 'ram:ID')
  guidelineId.textContent = 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended'
  guidelineContext.appendChild(guidelineId)
  context.appendChild(guidelineContext)
  root.appendChild(context)
  
  // ExchangedDocument (Invoice Header)
  const exchangedDoc = doc.createElementNS(root.namespaceURI, 'rsm:ExchangedDocument')
  
  const docId = doc.createElementNS(root.namespaceURI, 'ram:ID')
  docId.textContent = data.invoiceNumber
  exchangedDoc.appendChild(docId)
  
  const docTypeCode = doc.createElementNS(root.namespaceURI, 'ram:TypeCode')
  docTypeCode.textContent = '380' // Commercial Invoice
  exchangedDoc.appendChild(docTypeCode)
  
  const issueDateTime = doc.createElementNS(root.namespaceURI, 'ram:IssueDateTime')
  const issueDateTimeString = doc.createElementNS(root.namespaceURI, 'udt:DateTimeString')
  issueDateTimeString.setAttribute('format', '102')
  issueDateTimeString.textContent = formatDate(data.issueDate)
  issueDateTime.appendChild(issueDateTimeString)
  exchangedDoc.appendChild(issueDateTime)
  
  root.appendChild(exchangedDoc)
  
  // SupplyChainTradeTransaction
  const transaction = doc.createElementNS(root.namespaceURI, 'rsm:SupplyChainTradeTransaction')
  
  // Line Items
  data.lineItems.forEach((item, index) => {
    const lineItem = doc.createElementNS(root.namespaceURI, 'ram:IncludedSupplyChainTradeLineItem')
    
    const lineDoc = doc.createElementNS(root.namespaceURI, 'ram:AssociatedDocumentLineDocument')
    const lineId = doc.createElementNS(root.namespaceURI, 'ram:LineID')
    lineId.textContent = (index + 1).toString()
    lineDoc.appendChild(lineId)
    lineItem.appendChild(lineDoc)
    
    const tradeProduct = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedTradeProduct')
    const productName = doc.createElementNS(root.namespaceURI, 'ram:Name')
    productName.textContent = item.name
    tradeProduct.appendChild(productName)
    lineItem.appendChild(tradeProduct)
    
    const agreement = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedLineTradeAgreement')
    const netPrice = doc.createElementNS(root.namespaceURI, 'ram:NetPriceProductTradePrice')
    const chargeAmount = doc.createElementNS(root.namespaceURI, 'ram:ChargeAmount')
    chargeAmount.textContent = item.unitPrice.toFixed(2)
    netPrice.appendChild(chargeAmount)
    agreement.appendChild(netPrice)
    lineItem.appendChild(agreement)
    
    const delivery = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedLineTradeDelivery')
    const billedQty = doc.createElementNS(root.namespaceURI, 'ram:BilledQuantity')
    billedQty.setAttribute('unitCode', 'C62') // Unit
    billedQty.textContent = item.quantity.toString()
    delivery.appendChild(billedQty)
    lineItem.appendChild(delivery)
    
    const settlement = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedLineTradeSettlement')
    
    const tradeTax = doc.createElementNS(root.namespaceURI, 'ram:ApplicableTradeTax')
    const typeCode = doc.createElementNS(root.namespaceURI, 'ram:TypeCode')
    typeCode.textContent = 'VAT'
    tradeTax.appendChild(typeCode)
    
    const categoryCode = doc.createElementNS(root.namespaceURI, 'ram:CategoryCode')
    categoryCode.textContent = 'S' // Standard rate
    tradeTax.appendChild(categoryCode)
    
    const ratePercent = doc.createElementNS(root.namespaceURI, 'ram:RateApplicablePercent')
    ratePercent.textContent = (item.vatRate * 100).toFixed(2)
    tradeTax.appendChild(ratePercent)
    
    settlement.appendChild(tradeTax)
    
    const monetarySummation = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedTradeSettlementLineMonetarySummation')
    const lineTotalAmount = doc.createElementNS(root.namespaceURI, 'ram:LineTotalAmount')
    lineTotalAmount.textContent = item.netAmount.toFixed(2)
    monetarySummation.appendChild(lineTotalAmount)
    settlement.appendChild(monetarySummation)
    
    lineItem.appendChild(settlement)
    transaction.appendChild(lineItem)
  })
  
  // ApplicableHeaderTradeAgreement (Seller/Buyer)
  const agreement = doc.createElementNS(root.namespaceURI, 'ram:ApplicableHeaderTradeAgreement')
  
  const sellerParty = doc.createElementNS(root.namespaceURI, 'ram:SellerTradeParty')
  const sellerName = doc.createElementNS(root.namespaceURI, 'ram:Name')
  sellerName.textContent = data.seller.name
  sellerParty.appendChild(sellerName)
  
  if (data.seller.taxNumber) {
    const taxReg = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedTaxRegistration')
    const taxId = doc.createElementNS(root.namespaceURI, 'ram:ID')
    taxId.setAttribute('schemeID', 'VA') // VAT
    taxId.textContent = data.seller.taxNumber
    taxReg.appendChild(taxId)
    sellerParty.appendChild(taxReg)
  }
  
  if (data.seller.address) {
    const postalAddr = doc.createElementNS(root.namespaceURI, 'ram:PostalTradeAddress')
    if (data.seller.address.zip) {
      const postcode = doc.createElementNS(root.namespaceURI, 'ram:PostcodeCode')
      postcode.textContent = data.seller.address.zip
      postalAddr.appendChild(postcode)
    }
    if (data.seller.address.street) {
      const lineOne = doc.createElementNS(root.namespaceURI, 'ram:LineOne')
      lineOne.textContent = data.seller.address.street
      postalAddr.appendChild(lineOne)
    }
    if (data.seller.address.city) {
      const cityName = doc.createElementNS(root.namespaceURI, 'ram:CityName')
      cityName.textContent = data.seller.address.city
      postalAddr.appendChild(cityName)
    }
    if (data.seller.address.country) {
      const countryId = doc.createElementNS(root.namespaceURI, 'ram:CountryID')
      countryId.textContent = data.seller.address.country
      postalAddr.appendChild(countryId)
    }
    sellerParty.appendChild(postalAddr)
  }
  
  if (data.seller.email) {
    const emailComm = doc.createElementNS(root.namespaceURI, 'ram:URIUniversalCommunication')
    const uriId = doc.createElementNS(root.namespaceURI, 'ram:URIID')
    uriId.setAttribute('schemeID', 'EM')
    uriId.textContent = data.seller.email
    emailComm.appendChild(uriId)
    sellerParty.appendChild(emailComm)
  }
  
  agreement.appendChild(sellerParty)
  
  const buyerParty = doc.createElementNS(root.namespaceURI, 'ram:BuyerTradeParty')
  const buyerName = doc.createElementNS(root.namespaceURI, 'ram:Name')
  buyerName.textContent = data.buyer.name
  buyerParty.appendChild(buyerName)
  agreement.appendChild(buyerParty)
  
  transaction.appendChild(agreement)
  
  // ApplicableHeaderTradeDelivery (Billing Period)
  const delivery = doc.createElementNS(root.namespaceURI, 'ram:ApplicableHeaderTradeDelivery')
  const billingPeriod = doc.createElementNS(root.namespaceURI, 'ram:BillingSpecifiedPeriod')
  
  const startDateTime = doc.createElementNS(root.namespaceURI, 'ram:StartDateTime')
  const startDateString = doc.createElementNS(root.namespaceURI, 'udt:DateTimeString')
  startDateString.setAttribute('format', '102')
  startDateString.textContent = formatDate(data.billingPeriodStart)
  startDateTime.appendChild(startDateString)
  billingPeriod.appendChild(startDateTime)
  
  const endDateTime = doc.createElementNS(root.namespaceURI, 'ram:EndDateTime')
  const endDateString = doc.createElementNS(root.namespaceURI, 'udt:DateTimeString')
  endDateString.setAttribute('format', '102')
  endDateString.textContent = formatDate(data.billingPeriodEnd)
  endDateTime.appendChild(endDateString)
  billingPeriod.appendChild(endDateTime)
  
  delivery.appendChild(billingPeriod)
  transaction.appendChild(delivery)
  
  // ApplicableHeaderTradeSettlement (Payment Terms & Totals)
  const settlement = doc.createElementNS(root.namespaceURI, 'ram:ApplicableHeaderTradeSettlement')
  
  const paymentRef = doc.createElementNS(root.namespaceURI, 'ram:PaymentReference')
  paymentRef.textContent = data.invoiceNumber
  settlement.appendChild(paymentRef)
  
  const invoiceCurrency = doc.createElementNS(root.namespaceURI, 'ram:InvoiceCurrencyCode')
  invoiceCurrency.textContent = 'EUR'
  settlement.appendChild(invoiceCurrency)
  
  // Tax breakdown
  const taxBasis = doc.createElementNS(root.namespaceURI, 'ram:ApplicableTradeTax')
  const calcAmount = doc.createElementNS(root.namespaceURI, 'ram:CalculatedAmount')
  calcAmount.textContent = data.vatTotal.toFixed(2)
  taxBasis.appendChild(calcAmount)
  
  const taxTypeCode = doc.createElementNS(root.namespaceURI, 'ram:TypeCode')
  taxTypeCode.textContent = 'VAT'
  taxBasis.appendChild(taxTypeCode)
  
  const basisAmount = doc.createElementNS(root.namespaceURI, 'ram:BasisAmount')
  basisAmount.textContent = data.netTotal.toFixed(2)
  taxBasis.appendChild(basisAmount)
  
  const taxCategoryCode = doc.createElementNS(root.namespaceURI, 'ram:CategoryCode')
  taxCategoryCode.textContent = 'S'
  taxBasis.appendChild(taxCategoryCode)
  
  // Calculate average VAT rate
  const avgVatRate = data.netTotal > 0 ? (data.vatTotal / data.netTotal * 100) : 19
  const taxRate = doc.createElementNS(root.namespaceURI, 'ram:RateApplicablePercent')
  taxRate.textContent = avgVatRate.toFixed(2)
  taxBasis.appendChild(taxRate)
  
  settlement.appendChild(taxBasis)
  
  // Payment terms
  const paymentTerms = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedTradePaymentTerms')
  const dueDateTime = doc.createElementNS(root.namespaceURI, 'ram:DueDateDateTime')
  const dueDateString = doc.createElementNS(root.namespaceURI, 'udt:DateTimeString')
  dueDateString.setAttribute('format', '102')
  dueDateString.textContent = formatDate(data.dueDate)
  dueDateTime.appendChild(dueDateString)
  paymentTerms.appendChild(dueDateTime)
  settlement.appendChild(paymentTerms)
  
  // Monetary summation
  const monetarySummation = doc.createElementNS(root.namespaceURI, 'ram:SpecifiedTradeSettlementHeaderMonetarySummation')
  
  const lineTotalAmount = doc.createElementNS(root.namespaceURI, 'ram:LineTotalAmount')
  lineTotalAmount.textContent = data.netTotal.toFixed(2)
  monetarySummation.appendChild(lineTotalAmount)
  
  const taxBasisTotalAmount = doc.createElementNS(root.namespaceURI, 'ram:TaxBasisTotalAmount')
  taxBasisTotalAmount.textContent = data.netTotal.toFixed(2)
  monetarySummation.appendChild(taxBasisTotalAmount)
  
  const taxTotalAmount = doc.createElementNS(root.namespaceURI, 'ram:TaxTotalAmount')
  taxTotalAmount.setAttribute('currencyID', 'EUR')
  taxTotalAmount.textContent = data.vatTotal.toFixed(2)
  monetarySummation.appendChild(taxTotalAmount)
  
  const grandTotalAmount = doc.createElementNS(root.namespaceURI, 'ram:GrandTotalAmount')
  grandTotalAmount.textContent = data.grossTotal.toFixed(2)
  monetarySummation.appendChild(grandTotalAmount)
  
  const duePayableAmount = doc.createElementNS(root.namespaceURI, 'ram:DuePayableAmount')
  duePayableAmount.textContent = data.grossTotal.toFixed(2)
  monetarySummation.appendChild(duePayableAmount)
  
  settlement.appendChild(monetarySummation)
  transaction.appendChild(settlement)
  
  root.appendChild(transaction)
  
  // Serialize to XML string
  const serializer = new XMLSerializer()
  return serializer.serializeToString(doc)
}

/**
 * Format date to YYYYMMDD (Format 102 according to UN/CEFACT)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}
