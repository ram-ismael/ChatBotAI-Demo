import { BusinessTypeId } from '../models';
import { getBusiness } from './business-catalog';

const workflows: Record<BusinessTypeId, string> = {
  sales: 'Prioritize leads with a clear need, budget and timeline. A sample next step is to offer a short discovery call and record the main objection.',
  pharmacy: 'A sample refill flow collects a prescription reference, requests pharmacist review, then shows pickup options. This demo cannot access prescriptions, submit requests or advise on medication.',
  retail: 'A sample product search checks the item, size and preferred store before showing availability and return conditions. Inventory in this demo is fictional.',
  restaurant: 'A sample booking collects the date, time, party size and any accessibility or dietary requests, then asks the restaurant to confirm availability. No booking is created here.',
  education: 'A sample admissions flow asks for the programme and study level, then lists entry requirements, documents and an admissions contact. The demo does not submit applications.',
  clinic: 'A sample appointment flow collects the preferred service and availability, then passes the request to reception. This demo does not book appointments or provide medical advice.',
  'real-estate': 'Start with the preferred area, budget and property type. A sample shortlist compares price, space and viewing availability; properties and availability here are fictional.',
  support: 'Describe what happened, the expected result and the exact error message. A sample support flow checks the simplest reproducible steps, then prepares a handoff summary.',
  finance: 'A sample account-support flow explains which documents a representative may request and outlines a review process. This demo cannot access accounts, move money or recommend investments.',
  hr: 'A sample employee-support flow identifies the policy or vacancy, lists the required information and drafts a request for the HR team. No personnel records are accessed.',
  ecommerce: 'A sample order-support flow asks for an order reference and explains tracking, returns or delivery options. This demo does not access orders or issue refunds.',
  services: 'A sample service enquiry collects the scope, location, preferred date and budget, then prepares a quotation request. No job is booked in this demo.',
  general: 'Start by describing the task and the result you want. This demo can show example replies, draft a follow-up or outline the steps for a business enquiry.',
};

export function demoReply(id: BusinessTypeId, text: string): string {
  const business = getBusiness(id);
  const q = text.toLowerCase();
  const prefix = 'Simulated response • ' + business.label + '\n\n';
  if (/^(hi|hello|hey|ola|olá|bom dia)[!. ?]*$/i.test(text.trim())) {
    return prefix + 'Hello! Choose one of the suggested prompts or describe your task. I use prepared examples, and I do not access live business data.';
  }
  if (['pharmacy', 'clinic', 'finance'].includes(id)) return prefix + workflows[id];
  if (/thank|obrigad/.test(q)) return prefix + 'You are welcome! You can continue this chat, export it, or mark it resolved when you are finished.';
  if (/follow.up|draft|email|message|mensagem|escrev/.test(q)) {
    return prefix + 'Sample draft (not sent):\n\nHello, thank you for your interest. I wanted to follow up on your enquiry and check whether you have any questions. Could you share your preferred next step and a convenient time to continue?\n\nBest regards,\nThe ' + business.label + ' team';
  }
  if (/hour|opening|horario|horário/.test(q)) return prefix + 'Example opening hours: Monday–Friday, 09:00–17:00; Saturday, 09:00–13:00; Sunday closed. These are fictional hours for the demo.';
  if (/price|pricing|cost|budget|preço|custo/.test(q)) return prefix + 'For a sample quotation, specify the product or service, quantity, and preferred date. A real team would confirm availability and provide an itemized estimate. This demo has no live pricing.';
  if (id === 'sales' && /lead|pipeline|convert|risk/.test(q)) return prefix + 'Example pipeline review:\n• High priority: clear timeline and a confirmed decision-maker.\n• Medium priority: interest confirmed, budget still unknown.\n• At risk: no agreed next step.\n\nSuggested action: arrange a discovery call for high-priority leads and clarify budget with the remaining prospects. No CRM data was accessed.';
  if (id === 'sales' && /objection/.test(q)) return prefix + 'Example objections: unclear value, budget constraints and implementation time. Ask which matters most, clarify the desired outcome and offer a tailored walkthrough. These are example themes, not an analysis of real conversations.';
  if (/summari|summary|resum/.test(q)) return prefix + 'Example action summary:\n1. Clarify the request and required details.\n2. Confirm the next step with the relevant team.\n3. Record the outcome and follow up.\n\n' + workflows[id];
  return prefix + workflows[id] + '\n\nYou asked: “' + text.slice(0, 180) + '”\nTry a more specific question, or use the suggested prompts in a new conversation.';
}
