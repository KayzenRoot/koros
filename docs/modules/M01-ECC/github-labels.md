# M01 — Taxonomia de etiquetas GitHub (Nexlabs Technology)
**Estado de aplicação:** já aplicado nas issues #5..#20: nomes e agrupamento; cores personalizadas **PENDING**. Não afirmar que os tons abaixo estão ativos antes do read-back.

## Paleta alvo
| Tag exata | Cor hex sugerida | Significado |
|---|---|---|
| `module:M01-ECC` | `#8B5CF6` | Módulo ECC / fundação |
| `status:planned` | `#94A3B8` | Planejado, ainda não implementado |
| `cost:free-only` | `#10B981` | Apenas OSS e plataformas gratuitas |
| `priority:P0` | `#EF4444` | Bloqueador inicial/primeira execução |
| `priority:P1` | `#F97316` | Prioridade elevada após P0 |
| `priority:P2` | `#EAB308` | Fechamento e auditoria final |
| `kind:epic` | `#7C3AED` | Epic e visão do módulo |
| `kind:task` | `#64748B` | Issue técnica verificável |
| `area:coordination` | `#6366F1` | Gestão do módulo |
| `area:inventory` | `#0EA5E9` | Context Lock e ambiente |
| `area:supply-chain` | `#C084FC` | Proveniência/versões/licença |
| `area:codex-windows` | `#4F46E5` | Codex Desktop e Windows |
| `area:skills` | `#A855F7` | Skills e conhecimento |
| `area:agents` | `#9333EA` | Agentes e orquestração |
| `area:hooks` | `#D946EF` | Hooks e runtime |
| `area:mcp` | `#14B8A6` | Servidores MCP e permissões |
| `area:ecc-tools` | `#8B5CF6` | ECC Tools hospedado Free |
| `area:github-actions` | `#2563EB` | Actions e pipeline |
| `area:testing` | `#22C55E` | Testes e contratos |
| `area:security` | `#DC2626` | Segurança e análise estática |
| `area:governance` | `#475569` | GitHub ruleset/reviews |
| `area:verification` | `#06B6D4` | Validação e falsos positivos |
| `area:operations` | `#0D9488` | Instalação e rollback |
| `area:audit` | `#CA8A04` | Auditoria final |

Labels nativas preservadas: `documentation` (azul) e `enhancement` (teal). Não mudar nomes/cores de etiquetas GitHub que pertençam a outros módulos. A taxonomia exige status separado da prioridade e área: não usar label de bug simplesmente pela cor.

## Aplicação segura das cores pelo executor local
O conector GitHub do ChatGPT permitiu **criar e aplicar nomes** (GitHub devolveu `ededed` para customizadas), mas não expõe ação de criar/editar **cor**. Ao acessar GitHub CLI com identidade autorizada, Codex deverá:
1. Ler `gh auth status -h github.com`, `gh label list -R KayzenRoot/koros --json name,color,description -L 100` e garantir permissão admin/Issues write.
2. Tirar snapshot **sanitizado** da paleta atual em evidência local (sem secrets), não apagar nenhuma tag.
3. Somente para as 24 tags listadas acima, executar `gh label create <nome> -R KayzenRoot/koros --color HEX --description ... --force` uma a uma, comparando o valor anterior e aplicando apenas a mudança necessária. **Não** aplicar cores a tags fora da allowlist.
4. Fazer read-back e confirmar as 24 tags com cores hex corretas e etiquetas ligadas às issues #5..#20. Na primeira divergência ou falha, `STOP BLOCKED` e relatório; não apagar etiquetas de ninguém.
5. Repetir o mesmo padrão por novos módulos com paleta de módulo própria, sem renomear áreas compartilhadas inesperadamente.

### Script PowerShell idempotente para o Codex Desktop (somente quando acesso local estiver disponível)
```powershell
$ErrorActionPreference = 'Stop'
$repo = 'KayzenRoot/koros'
$palette = @(
  @{ Name='module:M01-ECC'; Color='8B5CF6'; Description='Módulo ECC / fundação' }
  @{ Name='status:planned'; Color='94A3B8'; Description='Planejado, ainda não implementado' }
  @{ Name='cost:free-only'; Color='10B981'; Description='Apenas OSS e plataformas gratuitas' }
  @{ Name='priority:P0'; Color='EF4444'; Description='Bloqueador inicial/primeira execução' }
  @{ Name='priority:P1'; Color='F97316'; Description='Prioridade elevada após P0' }
  @{ Name='priority:P2'; Color='EAB308'; Description='Fechamento e auditoria final' }
  @{ Name='kind:epic'; Color='7C3AED'; Description='Epic e visão do módulo' }
  @{ Name='kind:task'; Color='64748B'; Description='Issue técnica verificável' }
  @{ Name='area:coordination'; Color='6366F1'; Description='Gestão do módulo' }
  @{ Name='area:inventory'; Color='0EA5E9'; Description='Context Lock e ambiente' }
  @{ Name='area:supply-chain'; Color='C084FC'; Description='Proveniência/versões/licença' }
  @{ Name='area:codex-windows'; Color='4F46E5'; Description='Codex Desktop e Windows' }
  @{ Name='area:skills'; Color='A855F7'; Description='Skills e conhecimento' }
  @{ Name='area:agents'; Color='9333EA'; Description='Agentes e orquestração' }
  @{ Name='area:hooks'; Color='D946EF'; Description='Hooks e runtime' }
  @{ Name='area:mcp'; Color='14B8A6'; Description='Servidores MCP e permissões' }
  @{ Name='area:ecc-tools'; Color='8B5CF6'; Description='ECC Tools hospedado Free' }
  @{ Name='area:github-actions'; Color='2563EB'; Description='Actions e pipeline' }
  @{ Name='area:testing'; Color='22C55E'; Description='Testes e contratos' }
  @{ Name='area:security'; Color='DC2626'; Description='Segurança e análise estática' }
  @{ Name='area:governance'; Color='475569'; Description='GitHub ruleset/reviews' }
  @{ Name='area:verification'; Color='06B6D4'; Description='Validação e falsos positivos' }
  @{ Name='area:operations'; Color='0D9488'; Description='Instalação e rollback' }
  @{ Name='area:audit'; Color='CA8A04'; Description='Auditoria final' }
)
$null = gh auth status -h github.com
if ($LASTEXITCODE -ne 0) { throw 'BLOCKED: GitHub CLI sem autenticação válida.' }
foreach ($entry in $palette) {
  gh label create $entry.Name -R $repo --color $entry.Color --description $entry.Description --force
  if ($LASTEXITCODE -ne 0) { throw "BLOCKED: não foi possível definir a cor de $($entry.Name)" }
}
$actual = gh label list -R $repo --json name,color -L 100 | ConvertFrom-Json
foreach ($entry in $palette) {
  $found = @($actual | Where-Object { $_.name -ceq $entry.Name })
  if ($found.Count -ne 1 -or $found[0].color -ine $entry.Color) {
    throw "BLOCKED: cor não comprovada para $($entry.Name)"
  }
}
Write-Output 'PASS: 24 etiquetas criadas/coloridas e verificadas.'
```
**Atenção:** script **NÃO EXECUTADO nesta sessão**. A execução do `gh` precisa partir do ambiente conectado/autorizado que possa administrar as labels. Não registrar tokens nem publicar dados sensíveis.

Fonte: https://cli.github.com/manual/gh_label_create
