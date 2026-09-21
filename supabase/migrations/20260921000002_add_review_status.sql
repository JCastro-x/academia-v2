-- Add review status fields to topics table
alter table topics add column repasado boolean default false;
alter table topics add column subtemas_repasados jsonb default '[]'; -- array of subtema names that are marked as reviewed
