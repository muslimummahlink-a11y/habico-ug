import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Phone, Mail, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import habicoLogo from "@/assets/habico-logo.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyBranding } from "@/hooks/use-company-branding";

interface TenantDetails {
  name: string;
  nationalId: string;
  dob: string;
  poBox: string;
  contact: string;
  email: string;
  occupation: string;
  workplace: string;
  nextOfKin: string;
  nextOfKinContact: string;
  relationship: string;
}

interface PropertyDetails {
  usage: string;
  rooms: string;
  unitNo: string;
  location: string;
  village: string;
  parish: string;
  county: string;
  district: string;
  propertyName: string;
  streetName: string;
}

interface PaymentDetails {
  monthlyRent: number;
  amountPaid: number;
  periodPaid: string;
  deposit: number;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface BrandingConfig {
  logoUrl: string | null;
  primaryColor: string;
  companyName: string;
  documentFooter: string | null;
  phone: string;
  email: string;
  address: string;
}

export interface AgreementData {
  day: string;
  month: string;
  year: string;
  startDate: string;
  endDate: string;
  tenant: TenantDetails;
  property: PropertyDetails;
  payment: PaymentDetails;
  bank: BankDetails;
  signedDocumentUrl?: string;
  branding?: BrandingConfig;
}

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

function numberToWords(n: number): string {
  if (n === 0) return "ZERO";
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  function convert(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 1000000) return convert(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + convert(num % 1000) : "");
    return convert(Math.floor(num / 1000000)) + " MILLION" + (num % 1000000 ? " " + convert(num % 1000000) : "");
  }
  return convert(n);
}

const pageStyle = `
  @media print {
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }
    .no-print { display: none !important; }
    @page {
      margin: 0.6in 0.5in;
      size: A4 portrait;
    }
    .agreement-page {
      font-size: 10pt;
      line-height: 1.35;
    }
    .agreement-page table {
      page-break-inside: avoid;
    }
    .agreement-page ol {
      page-break-before: auto;
    }
  }
`;

export function TenancyAgreementDialog({ data: initialData }: { data: AgreementData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { data: branding } = useQuery({
    queryKey: ["agreement-company-branding"],
    queryFn: async () => {
      const { data: brandingData, error } = await supabase.rpc("get_company_branding").single();
      if (error && error.code !== "PGRST116") throw error;
      return brandingData as CompanyBranding | null;
    },
    staleTime: 1000 * 60 * 5,
  });
  const mergedData: AgreementData = branding
    ? {
        ...initialData,
        branding: {
          logoUrl: branding.logo_url,
          primaryColor: branding.primary_color,
          companyName: branding.company_name_override ?? "",
          documentFooter: branding.document_footer,
          phone: "0756742220 | 0702239607",
          email: "habicopropertymanagers@gmail.com",
          address: "BASIIMA BUILDING 2ND FLOOR ROOM C03\nP.O BOX 193498 KAMPALA",
        },
      }
    : initialData;
  const data = mergedData;
  const words = numberToWords(data.payment.monthlyRent);

  async function handleDownload() {
    if (!ref.current) return;
    setExporting(true);
    try {
      const node = ref.current;
      const imgData = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        style: { color: "#000000" },
      });

      // Get natural dimensions from the produced image
      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load rendered image"));
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (img.height * imgWidth) / img.width;

      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const safeName = (data.tenant.name || "tenant").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      pdf.save(`habico-tenancy-agreement-${safeName}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Could not generate PDF: " + ((err as any)?.message || "unknown error"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <style>{pageStyle}</style>
      <div className="flex justify-end mb-4 no-print">
        <Button onClick={handleDownload} disabled={exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {exporting ? "Generating PDF…" : "Download Agreement PDF"}
        </Button>
      </div>
      <div ref={ref} className="agreement-page bg-white text-black leading-relaxed p-6" style={{ fontFamily: "serif" }}>

        <div className="flex items-center justify-between border-b-2 pb-3 mb-4 gap-4" style={{ borderColor: data.branding?.primaryColor ?? "#000" }}>
          <img src={data.branding?.logoUrl ?? habicoLogo} alt={data.branding?.companyName ?? "Habico Property Managers"} className="h-20 w-auto object-contain" />
          <div className="text-xs leading-snug space-y-1">
            {data.branding ? (
              <>
                <div className="flex items-center gap-2 justify-end"><Phone className="h-3 w-3" /><span className="font-semibold">{data.branding.phone}</span></div>
                <div className="flex items-start gap-2 justify-end">
                  <Mail className="h-3 w-3 mt-0.5" />
                  <div className="text-right">
                    <div className="font-semibold">Email:</div>
                    <div>{data.branding.email}</div>
                  </div>
                </div>
                {data.branding.address && (
                  <div className="flex items-start gap-2 justify-end">
                    <MapPin className="h-3 w-3 mt-0.5" />
                    <div className="text-right"><div>{data.branding.address}</div></div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 justify-end"><Phone className="h-3 w-3" /><span className="font-semibold">0756742220 | 0702239607</span></div>
                <div className="flex items-start gap-2 justify-end">
                  <Mail className="h-3 w-3 mt-0.5" />
                  <div className="text-right">
                    <div className="font-semibold">Email Us Today Via:</div>
                    <div>habicopropertymanagers@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 justify-end">
                  <MapPin className="h-3 w-3 mt-0.5" />
                  <div className="text-right">
                    <div>BASIIMA BUILDING 2ND FLOOR ROOM C03</div>
                    <div>P.O BOX 193498 KAMPALA</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>


        <div className="text-center mb-6">
          <p className="font-bold underline">THE REPUBLIC OF UGANDA</p>
          <p>IN THE MATTER OF THE CONTRACT ACT, CAP 284</p>
          <p>AND</p>
          <p>IN THE MATTER OF THE LANDLORD AND TENANT ACT, CAP 238</p>
          <p>AND</p>
          <p className="font-bold underline">IN THE MATTER OF TENANCY AGREEMENT</p>
        </div>

        <p className="font-bold mb-4">TENANCY AGREEMENT</p>

        <p className="mb-2">
          THIS AGREEMENT is made this <span className="font-bold">{data.day}</span> day of <span className="font-bold">{data.month}</span> <span className="font-bold">{data.year}</span>
        </p>

        <p className="mb-4">
          BETWEEN <span className="font-bold">HABICO PROPERTY MANAGERS LIMITED</span> of P.O BOX 193498 Kampala, Tel No.
          (0756742220, 0773002276) (Herein after referred to as the &ldquo;Property Manager&rdquo;) which
          expression shall where the context so admits refer to their assignees, successors in title on one part.
        </p>

        <p className="mb-4">
          <span className="font-bold">{data.tenant.name.toUpperCase()}</span>
          of P.O BOX <span className="font-bold">{data.tenant.poBox}</span> Kampala, Tel <span className="font-bold">{data.tenant.contact}</span>
          (Herein after referred to as the &ldquo;Tenant&rdquo;) which expression shall where the
          context so admits refer his or her assignees, successors in title on the other part;
        </p>

        <p className="font-bold mb-2">A. TENANT PARTICULARS</p>
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr><td className="border border-black px-2 py-1 w-1/3 font-bold">PARTICULARS</td><td className="border border-black px-2 py-1 w-2/3 font-bold">DETAILS</td></tr>
            <tr><td className="border border-black px-2 py-1">Name</td><td className="border border-black px-2 py-1">{data.tenant.name}</td></tr>
            <tr><td className="border border-black px-2 py-1">National ID Number</td><td className="border border-black px-2 py-1">{data.tenant.nationalId}</td></tr>
            <tr><td className="border border-black px-2 py-1">Date of Birth</td><td className="border border-black px-2 py-1">{data.tenant.dob}</td></tr>
            <tr><td className="border border-black px-2 py-1">PO Box</td><td className="border border-black px-2 py-1">{data.tenant.poBox}</td></tr>
            <tr><td className="border border-black px-2 py-1">Contact</td><td className="border border-black px-2 py-1">{data.tenant.contact}</td></tr>
            <tr><td className="border border-black px-2 py-1">Email Address</td><td className="border border-black px-2 py-1">{data.tenant.email}</td></tr>
            <tr><td className="border border-black px-2 py-1">Tenant Occupation</td><td className="border border-black px-2 py-1">{data.tenant.occupation}</td></tr>
            <tr><td className="border border-black px-2 py-1">Place of work</td><td className="border border-black px-2 py-1">{data.tenant.workplace}</td></tr>
            <tr><td className="border border-black px-2 py-1">Name of Next of Kin</td><td className="border border-black px-2 py-1">{data.tenant.nextOfKin}</td></tr>
            <tr><td className="border border-black px-2 py-1">Contact</td><td className="border border-black px-2 py-1">{data.tenant.nextOfKinContact}</td></tr>
            <tr><td className="border border-black px-2 py-1">Nature of Relationship</td><td className="border border-black px-2 py-1">{data.tenant.relationship}</td></tr>
          </tbody>
        </table>

        <p className="font-bold mb-2">B. PROPERTY DETAILS</p>
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr><td className="border border-black px-2 py-1 w-1/3 font-bold" colSpan={2}>Item</td><td className="border border-black px-2 py-1 w-2/3 font-bold" colSpan={2}>Details</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Use</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.usage}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>No. of Rooms</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.rooms}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Suit No.</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.unitNo}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Location</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.location}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Village/Ward</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.village}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Parish</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.parish}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>County/Division</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.county}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>District/City</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.district}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Property Name</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.propertyName}</td></tr>
            <tr><td className="border border-black px-2 py-1" colSpan={2}>Street Name</td><td className="border border-black px-2 py-1" colSpan={2}>{data.property.streetName}</td></tr>
          </tbody>
        </table>

        <p className="font-bold mb-2">C. PAYMENT DETAILS</p>
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr><td className="border border-black px-2 py-1 w-2/3 font-bold">ITEM</td><td className="border border-black px-2 py-1 w-1/3 font-bold">UGX</td></tr>
            <tr><td className="border border-black px-2 py-1">Monthly Reserved Rent</td><td className="border border-black px-2 py-1 text-right">{data.payment.monthlyRent.toLocaleString()}/-</td></tr>
            <tr><td className="border border-black px-2 py-1">Amount of Rent Paid</td><td className="border border-black px-2 py-1 text-right">{data.payment.amountPaid.toLocaleString()}/-</td></tr>
            <tr><td className="border border-black px-2 py-1">Tenancy Period paid for</td><td className="border border-black px-2 py-1">{data.payment.periodPaid}</td></tr>
            <tr><td className="border border-black px-2 py-1">Security Deposit paid</td><td className="border border-black px-2 py-1 text-right">{data.payment.deposit.toLocaleString()}/-</td></tr>
            <tr><td className="border border-black px-2 py-1 font-bold">Total amount paid</td><td className="border border-black px-2 py-1 text-right font-bold">{(data.payment.amountPaid + data.payment.deposit).toLocaleString()}/-</td></tr>
          </tbody>
        </table>

        <p className="font-bold mb-2">D. BANK DETAILS</p>
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr><td className="border border-black px-2 py-1 font-bold">BANK NAME</td><td className="border border-black px-2 py-1 font-bold">ACCOUNT NUMBER</td><td className="border border-black px-2 py-1 font-bold">ACCOUNT NAME</td></tr>
            <tr><td className="border border-black px-2 py-1">{data.bank.bankName}</td><td className="border border-black px-2 py-1">{data.bank.accountNumber}</td><td className="border border-black px-2 py-1">{data.bank.accountName}</td></tr>
          </tbody>
        </table>

        <p className="font-bold mb-2">E. SERVICES AT THE PROPERTY</p>
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr><td className="border border-black px-2 py-1 w-1/2 font-bold">Service</td><td className="border border-black px-2 py-1 w-1/2 font-bold">Payable by</td></tr>
            <tr><td className="border border-black px-2 py-1">Water</td><td className="border border-black px-2 py-1">AGAINST THE TENANT</td></tr>
            <tr><td className="border border-black px-2 py-1">Electricity</td><td className="border border-black px-2 py-1">do</td></tr>
            <tr><td className="border border-black px-2 py-1">Sewerage</td><td className="border border-black px-2 py-1">do</td></tr>
            <tr><td className="border border-black px-2 py-1">Solid waste Collection</td><td className="border border-black px-2 py-1">do</td></tr>
            <tr><td className="border border-black px-2 py-1">Security services</td><td className="border border-black px-2 py-1">do</td></tr>
          </tbody>
        </table>

        <p className="font-bold mb-2">TERMS AND CONDITIONS</p>

        <p className="font-bold mb-1">DURATION, RENT AND SECURITY DEPOSIT</p>

        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li>The property manager agrees to let and the Tenant agrees to take the above premises for a duration of <span className="font-bold">ONE</span> year(s) with effect from <span className="font-bold">{data.startDate}</span> to <span className="font-bold">{data.endDate}</span> and the same shall automatically be renewed on similar terms if no termination has been preferred by either party.</li>
          <li>Both parties have mutually agreed on monthly rent of Ugx <span className="font-bold">{data.payment.monthlyRent.toLocaleString()}/-</span> (Uganda Shillings <span className="font-bold">{words}</span>), and once rent has been paid, it shall be none refundable.</li>
          <li>For avoidance of doubt, the same shall at all times be paid not later than the 25th day of the current running month. Where no rent is paid as stipulated, the property manager reserves the right to resort to means of recovery which may include disconnection of utilities, closure of premises, imposition of 5% penalty and or re-entry upon the demised premises.</li>
          <li>A security deposit of an equivalent to one month's rent shall be paid by the tenant at the commencement of this tenancy to secure the performance by the tenant of his/her obligations under this tenancy. The said security deposit shall be refundable as long as rent and service charges are dully paid and there are no damages occasioned to the demised property by the tenant. The security deposit shall be received by the tenant two weeks from the date of termination of their tenancy.</li>
          <li>The property manager hereby acknowledges receipt of the initial payments made thereof by signing this agreement and issuing a receipt.</li>
          <li>No installments of whatever nature shall be payable as rent.</li>
        </ol>

        <p className="font-bold mb-1">DUTIES AND OBLIGATIONS OF THE PARTIES</p>

        <ol className="list-decimal pl-6 space-y-2 mb-4" start={7}>
          <li>The property manager hereby agrees with the Tenant.
            <ol className="list-alpha pl-6 mt-1 space-y-1">
              <li>To ensure that the property owner discharges existing and future statutory rates, taxes and relevant Authorities, dues and/ or any other obligations, charges that are imposed upon the owner of the demised premises.</li>
              <li>To keep the exterior of the demised premises including main walls and roof of the said let out buildings, drains, pipes and structure of the demised premises in good and tenantable repair order and condition.</li>
              <li>That the tenant paying rent hereby reserved and performing and observing the obligation and conditions herein contained or implied and, on its part, to be performed and observed shall peacefully and quietly possess and enjoy the premises during the term hereby created without any interruption from or by the property manager or property owner or any person rightfully claiming from or under or in trust for the Landlord.</li>
              <li>To give a tenant a copy of the fully signed tenancy agreement.</li>
            </ol>
          </li>
          <li>The tenant hereby covenants with the property manager as follows;
            <ol className="list-alpha pl-6 mt-1 space-y-1">
              <li>To promptly pay the rent hereby reserved at all times and in a manner aforesaid.</li>
              <li>To promptly pay and discharge all future water bills, electricity charges, garbage collection charges, security charges, and any other service charges imposed during this tenancy.</li>
              <li>To utilize the premises hereby rented for the intended purposes only as per the agreement and not to use or permit them to be used for any illegal purposes.</li>
              <li>To keep the premises including the fixtures therein good and clean condition during the tenancy and in such condition to deliver up the same to the property manager at the termination of the tenancy in a tenable condition.</li>
              <li>To permit the property manager or his authorized agents at reasonable times to enter upon the premises or any part thereof after twenty-four hours' notice to examine the state and condition of the premises except for cases of emergencies.</li>
              <li>To make good of any damage occasioned to the demised premises by the tenant or any furniture and fittings or other articles, objects or things into or out of the demised premises or to pay to the property manager the cost of repairing or replacing any part of the premises or fittings damaged by the tenant or lost through his negligence.</li>
              <li>Not to assign, sublet or part with possession of the premises or any part thereof without the prior written consent of the property manager which consent shall not be unreasonably withheld.</li>
              <li>Not to do or permit to be done in or upon the premises or any part thereof any act or thing which may be of nuisance, damages, inconvenience or annoyance to the landlord or the tenants or the occupants or any other adjoining premises.</li>
              <li>Not to erect in the garden or land surrounding the premises any shed or other buildings without the prior consent of the property manager in writing.</li>
              <li>Shall leave the house cleaned at departure and in the event of default of this clause, it will attract a charge of Ugx. 50,000 to be paid either directly or deducted from security deposit.</li>
              <li>Not to forfeit rent for any repairs, alterations and renovations on the premises.</li>
              <li>An obligation to take care of their property on the premises as Habico Property Managers Limited shall not be liable for any theft, loss or damages occasioned on the tenant's property in the demised premises.</li>
              <li>To deliver up the premises at the expiry of the tenancy hereby created in such state or repair, condition, order and preservation as shall be in accordance with the obligations on the Tenant's part herein before contained.</li>
            </ol>
          </li>
        </ol>

        <p className="font-bold mb-1">CONDITIONS OF TENANT</p>
        <p className="mb-2">PROVIDED ALWAYS and it is expressly agreed as follows;</p>
        <ol className="list-decimal pl-6 space-y-2 mb-4" start={9}>
          <li>
            <ol className="list-alpha pl-6 mt-1 space-y-1">
              <li>That if the said rent or any part therefore is in arrears at any time after the day on which it is payable (whether formally demanded or not) or if any of the Tenant's stipulations herein are not performed then in any such case the property manager or his or her agents shall at any time thereafter re-enter upon the demised premises or any part thereof and take possession in presence of the local area council official and police and any house hold items found in the property shall be listed down and stored at the property managers store at a cost payable by the tenant.</li>
              <li>Where the tenant's properties have been remove under clause (a) herein above, the same shall be stored for 60 (sixty) days and where the defaulting tenant has not collected them, the same shall be sold to recover outstanding rent arrears, costs of storage and transportation.</li>
              <li>The tenancy shall be considered terminated by abandonment where the tenant is absent from the premises for (30) thirty consecutive days without notifying the property manager and without paying rent of the demised premises.</li>
              <li>That the property manager may in his absolute discretion review the said reserved rent on giving to the tenant not less than sixty days' notice in writing of his intention to do so PROVIDED THAT no more than one increases will be made in any one year.</li>
              <li>That any consents or notices which are required by the terms of this agreement to be given by property manager may validly be given by any person duly authorized by the property manager.</li>
              <li>It's a condition of this agreement that the tenant shall only access the premises at the commencement of their tenancy in the presence of the staff of Habico Property Managers Limited and the same shall be observed at the time of departure.</li>
              <li>Any notice under this agreement shall be in writing and any notice to the tenant shall be sufficiently served if left addressed to him on the premises or affixed to the door thereof, or sent electronically through the addresses or contacts provided herein above and any notice to the property manager shall be sufficiently served if sent by post or delivered at the offices of the property manager.</li>
            </ol>
          </li>
        </ol>

        <p className="font-bold mb-1">10. TERMINATION OF TENANCY</p>
        <ol className="list-decimal pl-6 space-y-2 mb-4" start={10}>
          <li>
            <ol className="list-alpha pl-6 mt-1 space-y-1">
              <li>The tenancy may be terminated by either party giving to the other 30 days' notice in writing of his or her desire to terminate the same.</li>
              <li>The issuance of termination Notice itself does not extinguish the Landlord or tenant's duties, rights and obligations under this tenancy agreement.</li>
              <li>Where the tenant does not vacate the demised premises on the date specified in the termination notice or upon breach, the property manager shall re-enter the demised premises and take possession thereon in presence of the area Local Council official and the police and any house hold items found in the property shall be listed down and stored at the property managers stores at a cost payable by the tenant.</li>
            </ol>
          </li>
        </ol>

        <p className="font-bold mb-1">11. DISPUTE RESOLUTION</p>
        <p className="mb-4">Any disputes between the property manager and the Tenant shall first be settled through mediation mechanism between the parties by a mediator agreed upon by both failures of which the parties may proceed to court.</p>

        <p className="font-bold mb-1">12. LAW APPLICABLE</p>
        <p className="mb-8">This agreement shall be governed by the provisions of the Laws of Uganda.</p>

        <p className="mb-4">IN WITNESS WHEREOF, the respective parties hereunto have affixed their hands and seal hereunto on the day, month and year first mentioned above.</p>

        <div className="flex justify-between mt-8">
          <div className="w-5/12">
            <p className="font-bold mb-2">SIGNED and DELIVERED on behalf of<br />Habico Property Managers Limited</p>
            <p>By the said:</p>
            <div className="mt-8 border-t border-black pt-1">
              <p className="font-bold">KANGWENDE</p>
              <p>HABICO PROPERTY MANAGERS LIMITED</p>
              <p>P.O. BOX 193498 KAMPALA</p>
              <p>Tel: 0786665301 / 0756742220</p>
              <div className="mt-2 text-xs">
                <p>Date: {data.day}/{data.month === "FEBRUARY" ? "02" : "    "}/{data.year}</p>
                <p>Property Manager</p>
              </div>
            </div>
          </div>
          <div className="w-5/12">
            <p className="font-bold mb-2">SIGNED and DELIVERED on behalf of</p>
            <p>By the said:</p>
            <div className="mt-8 border-t border-black pt-1">
              <p className="font-bold">{data.tenant.name.toUpperCase()}</p>
              <p>TENANT</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="font-bold mb-2">In presence of:</p>
          <div className="flex justify-between">
            <div className="w-5/12">
              <p>1. __________________________________</p>
              <div className="mt-6 border-t border-black pt-1">
                <p>Tel: 0756742220</p>
              </div>
            </div>
            <div className="w-5/12">
              <p>2. __________________________________</p>
              <div className="mt-6 border-t border-black pt-1">
                <p>WITNESSES</p>
              </div>
            </div>
          </div>
        </div>

        {data.branding?.documentFooter && (
          <div className="mt-6 text-center text-xs" style={{ color: data.branding.primaryColor }}>
            <p>{data.branding.documentFooter}</p>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Scanned with CS CamScanner</p>
        </div>
      </div>
    </div>
  );
}
