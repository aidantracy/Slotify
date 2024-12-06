create table
  public.time_intervals (
    id bigint generated by default as identity not null,
    created_at timestamp with time zone not null default now(),
    time_interval integer null default 30,
    user_id bigint null,
    constraint time_intervals_pkey primary key (id),
    constraint time_intervals_user_id_fkey foreign key (user_id) references users (id) on update cascade on delete cascade
  ) tablespace pg_default;

  create table
  public.bookings (
    id bigint generated by default as identity not null,
    created_at timestamp with time zone not null default now(),
    start_time time without time zone null,
    end_time time without time zone null,
    date date null,
    provider_id bigint not null,
    email_address text null,
    first_name text null,
    last_name text null,
    constraint unavailable_times_pkey primary key (id),
    constraint unavailable_times_user_id_fkey foreign key (provider_id) references users (id) on update cascade on delete cascade
  ) tablespace pg_default;

  create table
  public.users (
    id bigint generated by default as identity not null,
    created_at timestamp with time zone not null default now(),
    email_address text null,
    first_name text null,
    last_name text null,
    password text null,
    constraint users_pkey primary key (id)
  ) tablespace pg_default;