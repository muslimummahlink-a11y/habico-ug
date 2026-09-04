import type { SyncResult } from "./types";
import type { QboCustomer, QboVendor, QboInvoice, QboBill, QboPayment, QboQueryResponse } from "./types";

function parseQboId(id: string): number {
  return parseInt(id, 10);
}

export async function syncCustomers(
  realmId: string,
  accessToken: string,
  supabaseAdmin: any,
  companyId: string
): Promise<SyncResult> {
  const { qboQuery } = await import("./client");
  const result: SyncResult = { success: true, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0 };

  try {
    const response = await qboQuery<QboQueryResponse<QboCustomer>>(
      realmId, accessToken,
      "SELECT * FROM Customer WHERE Active = true MAXRESULTS 1000"
    );

    const customers = response.QueryResponse.Customer || [];
    result.records_processed = customers.length;

    for (const customer of customers) {
      const { data: existing } = await supabaseAdmin
        .from("suppliers")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", customer.DisplayName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from("suppliers")
          .update({
            name: customer.DisplayName,
            email: customer.PrimaryEmailAddr?.Address,
            phone: customer.PrimaryPhone?.FreeFormNumber,
            address: customer.BillAddr?.Line1,
          })
          .eq("id", existing.id);
        if (error) { result.records_failed++; } else { result.records_updated++; }
      } else {
        const { error } = await supabaseAdmin
          .from("suppliers")
          .insert({
            company_id: companyId,
            name: customer.DisplayName,
            contact_person: `${customer.GivenName ?? ""} ${customer.FamilyName ?? ""}`.trim() || null,
            email: customer.PrimaryEmailAddr?.Address,
            phone: customer.PrimaryPhone?.FreeFormNumber,
            address: customer.BillAddr?.Line1,
          });
        if (error) { result.records_failed++; } else { result.records_created++; }
      }
    }
  } catch (e: any) {
    result.success = false;
    result.error_message = e.message;
  }

  return result;
}

export async function syncVendors(
  realmId: string,
  accessToken: string,
  supabaseAdmin: any,
  companyId: string
): Promise<SyncResult> {
  const { qboQuery } = await import("./client");
  const result: SyncResult = { success: true, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0 };

  try {
    const response = await qboQuery<QboQueryResponse<QboVendor>>(
      realmId, accessToken,
      "SELECT * FROM Vendor WHERE Active = true MAXRESULTS 1000"
    );

    const vendors = response.QueryResponse.Vendor || [];
    result.records_processed = vendors.length;

    for (const vendor of vendors) {
      const { data: existing } = await supabaseAdmin
        .from("suppliers")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", vendor.DisplayName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from("suppliers")
          .update({
            name: vendor.DisplayName,
            email: vendor.PrimaryEmailAddr?.Address,
            phone: vendor.PrimaryPhone?.FreeFormNumber,
          })
          .eq("id", existing.id);
        if (error) { result.records_failed++; } else { result.records_updated++; }
      } else {
        const { error } = await supabaseAdmin
          .from("suppliers")
          .insert({
            company_id: companyId,
            name: vendor.DisplayName,
            contact_person: `${vendor.GivenName ?? ""} ${vendor.FamilyName ?? ""}`.trim() || null,
            email: vendor.PrimaryEmailAddr?.Address,
            phone: vendor.PrimaryPhone?.FreeFormNumber,
          });
        if (error) { result.records_failed++; } else { result.records_created++; }
      }
    }
  } catch (e: any) {
    result.success = false;
    result.error_message = e.message;
  }

  return result;
}

export async function syncInvoices(
  realmId: string,
  accessToken: string,
  supabaseAdmin: any,
  companyId: string
): Promise<SyncResult> {
  const { qboQuery } = await import("./client");
  const result: SyncResult = { success: true, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0 };

  try {
    const response = await qboQuery<QboQueryResponse<QboInvoice>>(
      realmId, accessToken,
      "SELECT * FROM Invoice WHERE Metadata.LastUpdatedTime > '2024-01-01' MAXRESULTS 1000"
    );

    const invoices = response.QueryResponse.Invoice || [];
    result.records_processed = invoices.length;

    for (const inv of invoices) {
      const { data: existing } = await supabaseAdmin
        .from("invoices")
        .select("id")
        .eq("company_id", companyId)
        .eq("invoice_number", inv.DocNumber)
        .maybeSingle();

      const status = inv.Balance > 0 ? (inv.Balance >= inv.TotalAmt ? "sent" : "paid") : "paid";

      const record = {
        company_id: companyId,
        client_name: inv.CustomerRef.name ?? "QBO Customer",
        invoice_number: inv.DocNumber ?? `QBO-${inv.Id}`,
        issue_date: inv.TxnDate,
        due_date: inv.DueDate,
        status,
        subtotal: inv.TotalAmt,
        total_amount: inv.TotalAmt,
        amount_paid: inv.TotalAmt - inv.Balance,
        notes: inv.CustomerMemo?.value,
      };

      if (existing) {
        const { error } = await supabaseAdmin.from("invoices").update(record).eq("id", existing.id);
        if (error) { result.records_failed++; } else { result.records_updated++; }
      } else {
        const { error } = await supabaseAdmin.from("invoices").insert(record);
        if (error) { result.records_failed++; } else { result.records_created++; }
      }
    }
  } catch (e: any) {
    result.success = false;
    result.error_message = e.message;
  }

  return result;
}

export async function syncBills(
  realmId: string,
  accessToken: string,
  supabaseAdmin: any,
  companyId: string
): Promise<SyncResult> {
  const { qboQuery } = await import("./client");
  const result: SyncResult = { success: true, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0 };

  try {
    const response = await qboQuery<QboQueryResponse<QboBill>>(
      realmId, accessToken,
      "SELECT * FROM Bill WHERE Metadata.LastUpdatedTime > '2024-01-01' MAXRESULTS 1000"
    );

    const bills = response.QueryResponse.Bill || [];
    result.records_processed = bills.length;

    for (const bill of bills) {
      const { data: existing } = await supabaseAdmin
        .from("bills")
        .select("id")
        .eq("company_id", companyId)
        .eq("bill_number", bill.DocNumber)
        .maybeSingle();

      const status = bill.Balance && bill.Balance > 0 ? "unpaid" : "paid";

      const record = {
        company_id: companyId,
        bill_number: bill.DocNumber ?? `QBO-${bill.Id}`,
        description: `QBO Bill from ${bill.VendorRef.name ?? "Unknown"}`,
        amount: bill.TotalAmt,
        due_date: bill.DueDate,
        status,
        paid_date: status === "paid" ? bill.TxnDate : null,
      };

      if (existing) {
        const { error } = await supabaseAdmin.from("bills").update(record).eq("id", existing.id);
        if (error) { result.records_failed++; } else { result.records_updated++; }
      } else {
        const { error } = await supabaseAdmin.from("bills").insert(record);
        if (error) { result.records_failed++; } else { result.records_created++; }
      }
    }
  } catch (e: any) {
    result.success = false;
    result.error_message = e.message;
  }

  return result;
}

export async function runFullSync(
  realmId: string,
  accessToken: string,
  supabaseAdmin: any,
  companyId: string
): Promise<{
  customers: SyncResult;
  vendors: SyncResult;
  invoices: SyncResult;
  bills: SyncResult;
}> {
  const [customers, vendors, invoices, bills] = await Promise.all([
    syncCustomers(realmId, accessToken, supabaseAdmin, companyId),
    syncVendors(realmId, accessToken, supabaseAdmin, companyId),
    syncInvoices(realmId, accessToken, supabaseAdmin, companyId),
    syncBills(realmId, accessToken, supabaseAdmin, companyId),
  ]);

  return { customers, vendors, invoices, bills };
}
