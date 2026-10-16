// src/lib/markdown.ts

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(text: string): string {
  let s = escapeHtml(text);

  // 加粗 **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 斜体 *text*
  s = s.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  // 行内代码 `code`
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');
  // 链接 [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return s;
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];

  let inList = false;
  let inOrderedList = false;
  let inTable = false;
  let tableHeader: string[] = [];
  let tableAlign: string[] = [];
  let tableRows: string[][] = [];

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (inOrderedList) {
      out.push('</ol>');
      inOrderedList = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;
    out.push('<table class="md-table">');
    if (tableHeader.length > 0) {
      out.push('<thead><tr>');
      tableHeader.forEach((h, i) => {
        const align = tableAlign[i] ? ` style="text-align:${tableAlign[i]}"` : '';
        out.push(`<th${align}>${inline(h.trim())}</th>`);
      });
      out.push('</tr></thead>');
    }
    out.push('<tbody>');
    for (const row of tableRows) {
      out.push('<tr>');
      row.forEach((cell, i) => {
        const align = tableAlign[i] ? ` style="text-align:${tableAlign[i]}"` : '';
        out.push(`<td${align}>${inline(cell.trim())}</td>`);
      });
      out.push('</tr>');
    }
    out.push('</tbody></table>');
    inTable = false;
    tableHeader = [];
    tableAlign = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 表格分隔行 |---|---|
    if (
      inTable &&
      /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(trimmed)
    ) {
      const cells = trimmed.replace(/^\||\|$/g, '').split('|');
      tableAlign = cells.map(c => {
        const t = c.trim();
        if (t.startsWith(':') && t.endsWith(':')) return 'center';
        if (t.endsWith(':')) return 'right';
        return 'left';
      });
      continue;
    }

    // 表格数据行
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.replace(/^\||\|$/g, '').split('|');
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 空行
    if (trimmed === '') {
      closeList();
      continue;
    }

    // 分隔线
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      closeList();
      out.push('<hr />');
      continue;
    }

    // 标题
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      closeList();
      const level = hMatch[1].length;
      out.push(`<h${level} class="md-h${level}">${inline(hMatch[2])}</h${level}>`);
      continue;
    }

    // 引用
    if (trimmed.startsWith('> ')) {
      closeList();
      out.push(`<blockquote class="md-quote">${inline(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    // 无序列表
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        closeList();
        out.push('<ul class="md-ul">');
        inList = true;
      }
      out.push(`<li>${inline(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOrderedList) {
        closeList();
        out.push('<ol class="md-ol">');
        inOrderedList = true;
      }
      out.push(`<li>${inline(trimmed.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    // 普通段落
    closeList();
    out.push(`<p class="md-p">${inline(trimmed)}</p>`);
  }

  closeList();
  flushTable();

  return out.join('\n');
}