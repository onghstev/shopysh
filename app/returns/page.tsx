import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Returns & Refund Policy | Shopysh',
  description: 'Shopysh Returns & Refund Policy — when and how products purchased through the Shopysh marketplace can be returned and refunded.',
};

const EFFECTIVE_DATE = '1 July 2026';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight" style={{ color: 'hsl(168 84% 26%)' }}>
            Shopysh
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 pb-24">
        {/* Title */}
        <div className="mb-10 border-b border-gray-100 pb-8">
          <p className="text-sm font-medium uppercase tracking-widest mb-3" style={{ color: 'hsl(168 84% 26%)' }}>
            Legal
          </p>
          <h1 className="text-4xl font-bold mb-3">Returns &amp; Refund Policy</h1>
          <p className="text-gray-500 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        {/* Intro */}
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            Welcome to <strong>Shopysh</strong>. This Returns &amp; Refund Policy explains the circumstances under which products purchased through the Shopysh marketplace may be returned and refunded.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Shopysh is a multi-tenant eCommerce marketplace that enables independent merchants (&ldquo;Sellers&rdquo;) to offer products to customers. Unless otherwise stated, the contract of sale is between the Customer and the Seller. Shopysh provides the technology platform to facilitate transactions but is not the manufacturer, distributor, or owner of products listed by Sellers.
          </p>
          <p className="text-gray-700 leading-relaxed mb-10">
            By placing an order on Shopysh, you agree to this Returns &amp; Refund Policy.
          </p>

          <Section id="1" title="1. Eligibility for Returns">
            <p>
              Products purchased through Shopysh are eligible for return <strong>only</strong> if:
            </p>
            <ul>
              <li>The product was <strong>damaged ab initio (upon delivery)</strong>; or</li>
              <li>The product is <strong>defective due to a manufacturing or functional fault</strong> that existed at the time of delivery.</li>
            </ul>
            <p>No other reason shall qualify a product for return unless otherwise required by applicable law.</p>
            <p>
              Customers must submit a return request and return the eligible product <strong>within seven (7) calendar days</strong> from the date the product was delivered.
            </p>
          </Section>

          <Section id="2" title="2. Conditions for Return">
            <p>To qualify for a return, the Customer must ensure that:</p>
            <ul>
              <li>The return request is submitted within seven (7) calendar days after delivery.</li>
              <li>The product is returned in substantially the same condition in which it was received, except for the reported defect or damage.</li>
              <li>The product is accompanied by its original packaging, accessories, manuals, warranty cards (where applicable), and proof of purchase.</li>
              <li>The product has not been intentionally damaged, altered, misused, or subjected to improper handling after delivery.</li>
            </ul>
            <p>Failure to satisfy these conditions may result in the return request being rejected.</p>
          </Section>

          <Section id="3" title="3. Non-Returnable Products">
            <p>Except where required by applicable law, the following products are not eligible for return:</p>
            <ul>
              <li>Products that are not damaged upon delivery or defective.</li>
              <li>Products damaged due to misuse, negligence, accident, improper installation, or unauthorized repairs.</li>
              <li>Products showing signs of abuse or excessive wear after delivery.</li>
              <li>Products with missing components, accessories, or packaging caused by the Customer.</li>
              <li>Personalized or custom-made products.</li>
              <li>Digital products or downloadable content.</li>
              <li>Gift cards and vouchers.</li>
              <li>Perishable goods.</li>
              <li>Products expressly marked as &ldquo;Non-Returnable&rdquo; or &ldquo;Final Sale.&rdquo;</li>
            </ul>
          </Section>

          <Section id="4" title="4. Reporting Damaged or Defective Products">
            <p>
              If a Customer receives a damaged or defective product, the Customer should initiate a return request through the Shopysh platform as soon as reasonably practicable and, in any event, no later than seven (7) calendar days after delivery.
            </p>
            <p>The Customer may be required to provide:</p>
            <ul>
              <li>photographs or videos clearly showing the defect or damage;</li>
              <li>photographs of the product packaging;</li>
              <li>the order number; and</li>
              <li>a description of the issue.</li>
            </ul>
            <p>Failure to provide sufficient evidence may delay or affect the processing of the return request.</p>
          </Section>

          <Section id="5" title="5. Return Process">
            <p>To request a return:</p>
            <ol>
              <li>Log into your Shopysh account.</li>
              <li>Navigate to your order history.</li>
              <li>Select the relevant order.</li>
              <li>Click <strong>Request Return</strong>.</li>
              <li>Select the reason for the return.</li>
              <li>Upload the required supporting evidence.</li>
              <li>Submit the request.</li>
            </ol>
            <p>The Seller will review the request and notify the Customer of its decision.</p>
            <p>Shopysh reserves the right to assist in resolving disputes between Customers and Sellers where appropriate.</p>
          </Section>

          <Section id="6" title="6. Inspection of Returned Products">
            <p>Returned products may be inspected by the Seller to verify:</p>
            <ul>
              <li>the reported defect or damage;</li>
              <li>the condition of the returned product; and</li>
              <li>compliance with this Policy.</li>
            </ul>
            <p>
              If inspection reveals that the product was not damaged upon delivery or defective, or that the damage resulted from the Customer&apos;s actions after delivery, the return request may be rejected.
            </p>
          </Section>

          <Section id="7" title="7. Refunds">
            <p>
              Where a return is approved, the Seller shall issue a refund through the original payment method, store credit, wallet balance, or another mutually agreed payment method, subject to applicable payment processing procedures.
            </p>
            <p>
              Shipping charges may also be refunded where the return results from a product that was damaged upon delivery or defective.
            </p>
            <p>Refund processing times may vary depending on the payment provider or financial institution.</p>
          </Section>

          <Section id="8" title="8. Return Shipping">
            <p>
              Where a return is approved because the product was damaged upon delivery or defective, the Seller shall bear the reasonable cost of return shipping unless otherwise agreed.
            </p>
            <p>
              Customers should not return products without first obtaining return authorization through the Shopysh platform.
            </p>
          </Section>

          <Section id="9" title="9. Marketplace Role">
            <p>Shopysh operates solely as a technology marketplace connecting Buyers and Sellers.</p>
            <p>Each Seller remains solely responsible for:</p>
            <ul>
              <li>product quality;</li>
              <li>product descriptions;</li>
              <li>product warranties;</li>
              <li>return approvals; and</li>
              <li>refunds.</li>
            </ul>
            <p>
              Shopysh may facilitate communication and dispute resolution but shall not be responsible for the manufacture, quality, or condition of products sold by independent Sellers.
            </p>
          </Section>

          <Section id="10" title="10. Fraud Prevention">
            <p>
              To protect Customers and Sellers, Shopysh reserves the right to reject return requests involving:
            </p>
            <ul>
              <li>false or misleading claims;</li>
              <li>products intentionally damaged after delivery;</li>
              <li>substituted or counterfeit products;</li>
              <li>missing accessories or components caused by the Customer;</li>
              <li>abuse of the returns process; or</li>
              <li>any fraudulent or dishonest conduct.</li>
            </ul>
            <p>Shopysh may suspend or terminate accounts found to have engaged in fraudulent return activity.</p>
          </Section>

          <Section id="11" title="11. Consumer Rights">
            <p>Nothing in this Policy limits or excludes any statutory consumer rights available under applicable law.</p>
            <p>
              Where mandatory consumer protection laws provide greater protection than this Policy, those laws shall prevail.
            </p>
          </Section>

          <Section id="12" title="12. Changes to this Policy">
            <p>Shopysh reserves the right to amend this Returns &amp; Refund Policy at any time.</p>
            <p>Any revised Policy shall become effective upon publication on the Shopysh platform.</p>
          </Section>

          <Section id="13" title="13. Contact">
            <p>
              For questions regarding returns or refunds, Customers should first contact the relevant Seller through their order page.
            </p>
            <p>
              Where additional assistance is required, Customers may contact Shopysh Customer Support through the support channels provided on the platform.
            </p>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Shopysh. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/pitch" className="hover:text-gray-900 transition-colors">About</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ id, title, children }: { id: string | number; title: string; children: React.ReactNode }) {
  return (
    <section id={`section-${id}`} className="mb-10">
      <h2
        className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100"
        style={{ color: 'hsl(168 84% 26%)' }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-gray-900">
        {children}
      </div>
    </section>
  );
}
