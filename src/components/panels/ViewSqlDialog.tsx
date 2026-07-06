import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SQL_DIALECTS, type SQLDialect } from '@/services/sql-parser'
import { useMemo, useState } from 'react'
import { useSchemaStore } from '@/hooks/useSchemaStore'
import { toSQL } from '@/services/export-import'
import { CopyIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ViewSqlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewSqlDialog({
  open,
  onOpenChange,
}: ViewSqlDialogProps) {
  const schema = useSchemaStore((s) => s.schema)
  const [dialect, setDialect] = useState<SQLDialect>('PostgreSQL')
  const [copied, setCopied] = useState(false)

  const sql = useMemo(() => {
    try {
      return toSQL(schema, dialect)
    } catch {
      return '-- Error generating SQL'
    }
  }, [schema, dialect])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      toast.success('SQL copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy SQL')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>View SQL</DialogTitle>
          <DialogDescription>
            Preview the generated SQL schema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="view-sql-dialect"
              className="text-muted-foreground text-sm font-medium whitespace-nowrap"
            >
              Database type:
            </label>
            <Select
              value={dialect}
              onValueChange={(v) => setDialect(v as SQLDialect)}
            >
              <SelectTrigger id="view-sql-dialect" className="w-[180px]">
                <SelectValue placeholder="Select dialect" />
              </SelectTrigger>
              <SelectContent>
                {SQL_DIALECTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <CheckIcon className="size-4 mr-2 text-green-500" />
            ) : (
              <CopyIcon className="size-4 mr-2" />
            )}
            Copy to Clipboard
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-muted rounded-md border mt-2">
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
            {sql || '-- No tables in schema'}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
