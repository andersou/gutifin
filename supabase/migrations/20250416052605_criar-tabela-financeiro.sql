create table financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text not null,
  valor numeric not null,
  criado_em timestamp with time zone default now()
);
