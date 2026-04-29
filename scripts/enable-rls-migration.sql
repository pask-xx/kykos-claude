-- Enable Row Level Security (RLS) for all KYKOS tables
-- Run this via Supabase SQL Editor or via psql

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
CREATE POLICY "Users are viewable by authenticated users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
CREATE POLICY "Organizations are viewable by authenticated users" ON organizations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizations are updatable by organization admins" ON organizations;
CREATE POLICY "Organizations are updatable by organization admins" ON organizations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM operators WHERE operators.organizationId = organizations.id AND operators.id = auth.uid() AND 'ORGANIZATION_ADMIN' = ANY(operators.permissions))
);

-- Operators table
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Operators are viewable by organization members" ON operators;
CREATE POLICY "Operators are viewable by organization members" ON operators FOR SELECT USING (
  organizationId IN (SELECT organizationId FROM operators WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Operators can update own profile" ON operators;
CREATE POLICY "Operators can update own profile" ON operators FOR UPDATE USING (auth.uid() = id);

-- GoodsRequests table
ALTER TABLE goods_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Goods requests are viewable by participants" ON goods_requests;
CREATE POLICY "Goods requests are viewable by participants" ON goods_requests FOR SELECT USING (
  beneficiaryId = auth.uid()
  OR intermediaryId IN (SELECT organizationId FROM operators WHERE id = auth.uid())
  OR fulfilledById = auth.uid()
);
DROP POLICY IF EXISTS "Beneficiaries can create goods requests" ON goods_requests;
CREATE POLICY "Beneficiaries can create goods requests" ON goods_requests FOR INSERT WITH CHECK (beneficiaryId = auth.uid());
DROP POLICY IF EXISTS "Beneficiaries can update own requests" ON goods_requests;
CREATE POLICY "Beneficiaries can update own requests" ON goods_requests FOR UPDATE USING (beneficiaryId = auth.uid());
DROP POLICY IF EXISTS "Operators can update requests for their organization" ON goods_requests;
CREATE POLICY "Operators can update requests for their organization" ON goods_requests FOR UPDATE USING (intermediaryId IN (SELECT organizationId FROM operators WHERE id = auth.uid()));

-- GoodsOffers table
ALTER TABLE goods_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Goods offers are viewable by participants" ON goods_offers;
CREATE POLICY "Goods offers are viewable by participants" ON goods_offers FOR SELECT USING (
  offeredById = auth.uid()
  OR EXISTS (SELECT 1 FROM goods_requests WHERE goods_requests.id = goods_offers.requestId AND goods_requests.beneficiaryId = auth.uid())
  OR EXISTS (SELECT 1 FROM goods_requests JOIN operators ON goods_requests.intermediaryId = operators.organizationId WHERE goods_requests.id = goods_offers.requestId AND operators.id = auth.uid())
);
DROP POLICY IF EXISTS "Donors can create offers" ON goods_offers;
CREATE POLICY "Donors can create offers" ON goods_offers FOR INSERT WITH CHECK (offeredById = auth.uid());

-- Notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (recipientUserId = auth.uid());
DROP POLICY IF EXISTS "Operators can view own notifications" ON notifications;
CREATE POLICY "Operators can view own notifications" ON notifications FOR SELECT USING (recipientOperatorId = auth.uid());
DROP POLICY IF EXISTS "Notifications are creatable by system" ON notifications;
CREATE POLICY "Notifications are creatable by system" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (recipientUserId = auth.uid());
DROP POLICY IF EXISTS "Operators can update own notifications" ON notifications;
CREATE POLICY "Operators can update own notifications" ON notifications FOR UPDATE USING (recipientOperatorId = auth.uid());

-- Objects table
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Objects are viewable by authenticated users" ON objects;
CREATE POLICY "Objects are viewable by authenticated users" ON objects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Donors can create objects" ON objects;
CREATE POLICY "Donors can create objects" ON objects FOR INSERT WITH CHECK (donorId = auth.uid());
DROP POLICY IF EXISTS "Donors can update own objects" ON objects;
CREATE POLICY "Donors can update own objects" ON objects FOR UPDATE USING (donorId = auth.uid());
DROP POLICY IF EXISTS "Intermediaries can update objects in their organization" ON objects;
CREATE POLICY "Intermediaries can update objects in their organization" ON objects FOR UPDATE USING (
  intermediaryId IN (SELECT organizationId FROM operators WHERE id = auth.uid())
);

-- Requests table
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Requests are viewable by participants" ON requests;
CREATE POLICY "Requests are viewable by participants" ON requests FOR SELECT USING (
  recipientId = auth.uid()
  OR EXISTS (SELECT 1 FROM objects JOIN operators ON objects.intermediaryId = operators.organizationId WHERE objects.id = requests.objectId AND operators.id = auth.uid())
);
DROP POLICY IF EXISTS "Recipients can create requests" ON requests;
CREATE POLICY "Recipients can create requests" ON requests FOR INSERT WITH CHECK (recipientId = auth.uid());

-- Donations table
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Donations are viewable by participants" ON donations;
CREATE POLICY "Donations are viewable by participants" ON donations FOR SELECT USING (
  recipientId = auth.uid()
  OR donorId = auth.uid()
  OR EXISTS (SELECT 1 FROM requests JOIN objects ON requests.objectId = objects.id JOIN operators ON objects.intermediaryId = operators.organizationId WHERE requests.id = donations.requestId AND operators.id = auth.uid())
);

-- Reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reports are viewable by organization admins" ON reports;
CREATE POLICY "Reports are viewable by organization admins" ON reports FOR SELECT USING (
  intermediaryId IN (SELECT organizationId FROM operators WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporterId = auth.uid());

-- DonorProfiles table
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Donor profiles are viewable by authenticated users" ON donor_profiles;
CREATE POLICY "Donor profiles are viewable by authenticated users" ON donor_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own donor profile" ON donor_profiles;
CREATE POLICY "Users can update own donor profile" ON donor_profiles FOR UPDATE USING (userId = auth.uid());

-- Payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments are viewable by organization admins" ON payments;
CREATE POLICY "Payments are viewable by organization admins" ON payments FOR SELECT USING (
  intermediaryId IN (SELECT organizationId FROM operators WHERE id = auth.uid())
);

-- Provinces table
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Provinces are viewable by all" ON provinces;
CREATE POLICY "Provinces are viewable by all" ON provinces FOR SELECT USING (true);

-- Comuni table
ALTER TABLE comunes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comuni are viewable by all" ON comunes;
CREATE POLICY "Comuni are viewable by all" ON comunes FOR SELECT USING (true);

-- Verify RLS is enabled
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND relrowsecurity = true;
