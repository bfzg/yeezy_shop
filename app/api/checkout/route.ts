import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWritableSessionId } from "@/lib/db";
import { createOrderFromSubmittedCart } from "@/lib/orders";
import { createPayment } from "@/lib/payments";

export async function POST(request: Request) {
  const sessionId = await getWritableSessionId();
  const user = await getCurrentUser();
  const body = await request.json();
  const required = ["email", "firstName", "lastName", "address", "city", "country", "province", "postalCode", "phone"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
    }
  }

  try {
    const order = createOrderFromSubmittedCart(body.cartItems ?? [], {
      userId: user?.id,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      address: body.address,
      apartment: body.apartment,
      city: body.city,
      country: body.country,
      province: body.province,
      postalCode: body.postalCode,
      phone: body.phone,
      paymentProvider: body.paymentProvider ?? "manual"
    }, sessionId);
    const payment = await createPayment(order.orderId, body.paymentProvider ?? "manual", order.totals.totalCents);
    return NextResponse.json({ ...order, payment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status: 400 });
  }
}
