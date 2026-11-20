-- Semilla de la prueba (T-103 a): dos licencias ficticias, A y B, de dos clientes distintos. Sin
-- secretos, códigos ni tokens: los códigos de activación los genera una persona con `generar_codigo`.
-- Reejecutable: no duplica.
begin;
insert into conector_prueba.licencias (id, cliente_id, tipo)
select '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000c0a1', 'A'
where not exists (select 1 from conector_prueba.licencias where tipo = 'A' and estado <> 'revocada');
insert into conector_prueba.licencias (id, cliente_id, tipo)
select '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c0b1', 'B'
where not exists (select 1 from conector_prueba.licencias where tipo = 'B' and estado <> 'revocada');
commit;
