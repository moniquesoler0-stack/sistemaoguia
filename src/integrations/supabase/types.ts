export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      loja_canais: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          ordem: number
          parcelamento: Json
          taxa_fixa: number
          taxa_pct: number
          user_id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
          parcelamento?: Json
          taxa_fixa?: number
          taxa_pct?: number
          user_id: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
          parcelamento?: Json
          taxa_fixa?: number
          taxa_pct?: number
          user_id?: string
        }
        Relationships: []
      }
      loja_catalogo_config: {
        Row: {
          ativo: boolean
          bio: string | null
          canal_preco_id: string | null
          cor_destaque: string | null
          criado_em: string
          id: string
          instagram: string | null
          logo_url: string | null
          slug: string | null
          titulo: string | null
          user_id: string
          visitas: number
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          bio?: string | null
          canal_preco_id?: string | null
          cor_destaque?: string | null
          criado_em?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          slug?: string | null
          titulo?: string | null
          user_id: string
          visitas?: number
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          bio?: string | null
          canal_preco_id?: string | null
          cor_destaque?: string | null
          criado_em?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          slug?: string | null
          titulo?: string | null
          user_id?: string
          visitas?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loja_catalogo_config_canal_preco_id_fkey"
            columns: ["canal_preco_id"]
            isOneToOne: false
            referencedRelation: "loja_canais"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_clientes: {
        Row: {
          contato: string | null
          criado_em: string
          id: string
          instagram: string | null
          nome: string
          observacao: string | null
          tamanho_habitual: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          contato?: string | null
          criado_em?: string
          id?: string
          instagram?: string | null
          nome: string
          observacao?: string | null
          tamanho_habitual?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          contato?: string | null
          criado_em?: string
          id?: string
          instagram?: string | null
          nome?: string
          observacao?: string | null
          tamanho_habitual?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      loja_compras: {
        Row: {
          criado_em: string
          data: string
          fornecedor_id: string | null
          frete_total: number
          id: string
          itens: Json
          user_id: string
        }
        Insert: {
          criado_em?: string
          data?: string
          fornecedor_id?: string | null
          frete_total?: number
          id?: string
          itens?: Json
          user_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          fornecedor_id?: string | null
          frete_total?: number
          id?: string
          itens?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loja_compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "loja_fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_config: {
        Row: {
          criado_em: string
          id: string
          imposto_pct: number
          investimento_ads_mensal: number
          margem_minima_pct: number
          nome_loja: string | null
          onboarding_concluido: boolean
          slug: string | null
          user_id: string
          volume_mensal_esperado: number
        }
        Insert: {
          criado_em?: string
          id?: string
          imposto_pct?: number
          investimento_ads_mensal?: number
          margem_minima_pct?: number
          nome_loja?: string | null
          onboarding_concluido?: boolean
          slug?: string | null
          user_id: string
          volume_mensal_esperado?: number
        }
        Update: {
          criado_em?: string
          id?: string
          imposto_pct?: number
          investimento_ads_mensal?: number
          margem_minima_pct?: number
          nome_loja?: string | null
          onboarding_concluido?: boolean
          slug?: string | null
          user_id?: string
          volume_mensal_esperado?: number
        }
        Relationships: []
      }
      loja_custos_fixos: {
        Row: {
          criado_em: string
          id: string
          nome: string
          user_id: string
          valor_mensal: number
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          user_id: string
          valor_mensal?: number
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          user_id?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      loja_estoque: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          minimo: number
          produto_id: string | null
          quantidade: number
          user_id: string
          variacao: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          minimo?: number
          produto_id?: string | null
          quantidade?: number
          user_id: string
          variacao?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          minimo?: number
          produto_id?: string | null
          quantidade?: number
          user_id?: string
          variacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loja_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "loja_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_financeiro_lancamentos: {
        Row: {
          categoria: string | null
          criado_em: string
          data: string
          descricao: string | null
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          criado_em?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          criado_em?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      loja_fornecedores: {
        Row: {
          contato: string | null
          criado_em: string
          id: string
          nome: string
          observacao: string | null
          user_id: string
        }
        Insert: {
          contato?: string | null
          criado_em?: string
          id?: string
          nome: string
          observacao?: string | null
          user_id: string
        }
        Update: {
          contato?: string | null
          criado_em?: string
          id?: string
          nome?: string
          observacao?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loja_itens_embalagem: {
        Row: {
          aplicar_por_padrao: boolean
          criado_em: string
          id: string
          nome: string
          user_id: string
          valor_unitario: number
        }
        Insert: {
          aplicar_por_padrao?: boolean
          criado_em?: string
          id?: string
          nome: string
          user_id: string
          valor_unitario?: number
        }
        Update: {
          aplicar_por_padrao?: boolean
          criado_em?: string
          id?: string
          nome?: string
          user_id?: string
          valor_unitario?: number
        }
        Relationships: []
      }
      loja_movimentos_estoque: {
        Row: {
          criado_em: string
          id: string
          motivo: string | null
          observacao: string | null
          origem_id: string | null
          produto_id: string | null
          quantidade: number
          tipo: string
          user_id: string
          variacao: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          motivo?: string | null
          observacao?: string | null
          origem_id?: string | null
          produto_id?: string | null
          quantidade?: number
          tipo: string
          user_id: string
          variacao?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          motivo?: string | null
          observacao?: string | null
          origem_id?: string | null
          produto_id?: string | null
          quantidade?: number
          tipo?: string
          user_id?: string
          variacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loja_movimentos_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "loja_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_produtos: {
        Row: {
          ativo: boolean
          criado_em: string
          custo_mercadoria: number
          fornecedor_id: string | null
          foto_url: string | null
          frete_rateado: number
          id: string
          itens_embalagem: Json
          margem_alvo_pct: number
          nome: string
          perda_pct: number
          preco_atual: number
          publicado: boolean
          user_id: string
          variacoes: Json
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          custo_mercadoria?: number
          fornecedor_id?: string | null
          foto_url?: string | null
          frete_rateado?: number
          id?: string
          itens_embalagem?: Json
          margem_alvo_pct?: number
          nome: string
          perda_pct?: number
          preco_atual?: number
          publicado?: boolean
          user_id: string
          variacoes?: Json
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          custo_mercadoria?: number
          fornecedor_id?: string | null
          foto_url?: string | null
          frete_rateado?: number
          id?: string
          itens_embalagem?: Json
          margem_alvo_pct?: number
          nome?: string
          perda_pct?: number
          preco_atual?: number
          publicado?: boolean
          user_id?: string
          variacoes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "loja_produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "loja_fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_venda_itens: {
        Row: {
          criado_em: string
          custo_unitario_no_momento: number
          id: string
          lucro_unitario: number
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          user_id: string
          variacao: string
          venda_id: string
        }
        Insert: {
          criado_em?: string
          custo_unitario_no_momento?: number
          id?: string
          lucro_unitario?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          user_id: string
          variacao?: string
          venda_id: string
        }
        Update: {
          criado_em?: string
          custo_unitario_no_momento?: number
          id?: string
          lucro_unitario?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          user_id?: string
          variacao?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loja_venda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "loja_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loja_venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "loja_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_vendas: {
        Row: {
          canal_id: string | null
          cliente_id: string | null
          criado_em: string
          data: string
          desconto: number
          forma_pagamento: string | null
          frete_cobrado: number
          id: string
          itens: Json
          lucro_total: number
          observacao: string | null
          parcelas: number
          status: string
          total: number
          user_id: string
        }
        Insert: {
          canal_id?: string | null
          cliente_id?: string | null
          criado_em?: string
          data?: string
          desconto?: number
          forma_pagamento?: string | null
          frete_cobrado?: number
          id?: string
          itens?: Json
          lucro_total?: number
          observacao?: string | null
          parcelas?: number
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          canal_id?: string | null
          cliente_id?: string | null
          criado_em?: string
          data?: string
          desconto?: number
          forma_pagamento?: string | null
          frete_cobrado?: number
          id?: string
          itens?: Json
          lucro_total?: number
          observacao?: string | null
          parcelas?: number
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loja_vendas_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "loja_canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loja_vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "loja_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          criado_em: string
          email: string | null
          id: string
          nome: string | null
          pro_expira_em: string | null
          pro_trial_expira_em: string | null
          pro_trial_iniciado_em: string | null
          tem_minha_loja: boolean
          tem_minha_loja_pro: boolean
        }
        Insert: {
          criado_em?: string
          email?: string | null
          id: string
          nome?: string | null
          pro_expira_em?: string | null
          pro_trial_expira_em?: string | null
          pro_trial_iniciado_em?: string | null
          tem_minha_loja?: boolean
          tem_minha_loja_pro?: boolean
        }
        Update: {
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string | null
          pro_expira_em?: string | null
          pro_trial_expira_em?: string | null
          pro_trial_iniciado_em?: string | null
          tem_minha_loja?: boolean
          tem_minha_loja_pro?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
