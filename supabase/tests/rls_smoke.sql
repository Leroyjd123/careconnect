-- RLS + trigger smoke test. Each line marked "expect …" should error or return what it says.
-- Run after supabase_stub.sql and the migration (see README.md in this folder).
\set ON_ERROR_STOP 0
-- seed as superuser (like the invite server action with service role)
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000d','doc@x.com','{}'),
 ('00000000-0000-0000-0000-00000000000e','doc2@x.com','{}'),
 ('00000000-0000-0000-0000-000000000001','ravi@x.com','{"full_name":"Ravi Kumar"}'),
 ('00000000-0000-0000-0000-000000000002','q@x.com','{"full_name":"Q"}');
update profiles set role='doctor', full_name='Dr. Sharma' where email in ('doc@x.com','doc2@x.com');
insert into conversations (id,doctor_id,patient_id) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-000000000002');
select 'profile names', full_name, status from profiles order by email;
update auth.users set last_sign_in_at=now() where email='ravi@x.com';
select 'ravi status after sign-in', status from profiles where email='ravi@x.com';

-- ===== as patient Ravi =====
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'P sees convs', count(*) from conversations;
select 'P sees profiles', count(*) from profiles;
insert into messages (conversation_id,sender_id,body) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Headache since yesterday');
select 'P msg ok';
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into messages (conversation_id,sender_id,body) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','sneaky'); -- expect RLS error
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update profiles set role='doctor' where id='00000000-0000-0000-0000-000000000001'; -- expect permission denied
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update profiles set language='kn' where id='00000000-0000-0000-0000-000000000001';
select 'P lang', language from profiles where id='00000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id,name) values ('attachments','10000000-0000-0000-0000-000000000001/a.pdf');
select 'P upload own ok';
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id,name) values ('attachments','10000000-0000-0000-0000-000000000002/a.pdf'); -- expect RLS error
rollback;

-- ===== as doctor =====
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
select 'D inbox', other_name, unread_count, last_message_preview from my_conversations();
select mark_read('10000000-0000-0000-0000-000000000001');
select 'D unread after mark', unread_count from my_conversations();
insert into prescriptions (id,conversation_id,doctor_id,patient_id) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000001');
insert into prescription_items (prescription_id,medicine,dose,frequency,duration,timing) values ('20000000-0000-0000-0000-000000000001','Paracetamol 650 mg','1 tablet','1-0-1','3 days','After food');
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
insert into prescriptions (conversation_id,doctor_id,patient_id) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000002'); -- wrong patient: expect RLS error
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'P sees draft?', count(*) from prescriptions;
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
select 'issue', issue_prescription('20000000-0000-0000-0000-000000000001') is not null;
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
update prescriptions set advice='x' where id='20000000-0000-0000-0000-000000000001';
select 'D update issued rows affected (expect 0)';
rollback;
-- even superuser cannot edit an issued rx
update prescriptions set advice='x' where id='20000000-0000-0000-0000-000000000001'; -- expect lock exception
insert into prescription_items (prescription_id,medicine,dose,frequency,duration) values ('20000000-0000-0000-0000-000000000001','X','1','1','1'); -- expect lock exception
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'P sees issued', count(*) from prescriptions;
select 'P sees items', count(*) from prescription_items;
select 'P inbox', other_name, unread_count, last_message_preview from my_conversations();
select 'P msgs', kind from messages order by created_at;
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select issue_prescription('20000000-0000-0000-0000-000000000001'); -- expect not found
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select 'Q sees ravi msgs', count(*) from messages;
select 'Q sees rx', count(*) from prescriptions;
rollback;

-- ===== push subscriptions (0002) =====
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into push_subscriptions (user_id,endpoint,p256dh,auth) values ('00000000-0000-0000-0000-000000000001','https://push.example/ravi','k','a');
select 'P push own ok';
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into push_subscriptions (user_id,endpoint,p256dh,auth) values ('00000000-0000-0000-0000-00000000000d','https://push.example/fake','k','a'); -- expect RLS error
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
select 'D sees P subs directly (expect 0)', count(*) from push_subscriptions;
select 'D push_targets conv1 (expect 1)', count(*) from push_targets('10000000-0000-0000-0000-000000000001');
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000e';
select 'other doctor push_targets conv1 (expect 0)', count(*) from push_targets('10000000-0000-0000-0000-000000000001');
rollback;

-- ===== invite links + report removal (0003) =====
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
insert into invite_links (token, doctor_id) values ('tok-doc', '00000000-0000-0000-0000-00000000000d');
select 'D link ok';
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into invite_links (token, doctor_id) values ('tok-pat', '00000000-0000-0000-0000-000000000001'); -- expect RLS error (not a doctor)
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select 'P sees links (expect 0)', count(*) from invite_links;
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
update invite_links set used_at = now() where token = 'tok-doc'; -- expect permission denied (only revoked_at)
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000e';
insert into messages (conversation_id,sender_id,kind,file_path,file_name) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000e','file','10000000-0000-0000-0000-000000000002/x.pdf','x.pdf');
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
select remove_report((select id from messages where file_name='x.pdf')); -- expect error: not this doctor's conversation
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000e';
select 'D2 removes own report', remove_report((select id from messages where file_name='x.pdf'));
select 'tombstone', deleted_at is not null, file_path is null from messages where kind='file' and conversation_id='10000000-0000-0000-0000-000000000002';
rollback;

-- ===== patient details, blocking, master medicines (0004) =====
update profiles set blocked_at = now() where id = '00000000-0000-0000-0000-000000000001';
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into messages (conversation_id,sender_id,body) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','blocked'); -- expect RLS error
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update profiles set height_cm = 170 where id = '00000000-0000-0000-0000-000000000001'; -- expect permission denied (doctor-only field)
rollback;
update profiles set blocked_at = null where id = '00000000-0000-0000-0000-000000000001';
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-00000000000d';
insert into medicines (doctor_id, name) values ('00000000-0000-0000-0000-00000000000d', 'Paracetamol 650 mg');
select 'D medicine ok';
delete from medicines where name = 'Paracetamol 650 mg'; -- expect permission denied (never deleted)
rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into medicines (doctor_id, name) values ('00000000-0000-0000-0000-000000000001', 'Sneaky'); -- expect RLS error (not a doctor)
rollback;
