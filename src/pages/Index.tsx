import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gem, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { dict, type Lang } from "@/lib/i18n";
import SlipForm from "@/components/SlipForm";
import RecordsView from "@/components/RecordsView";

const T = (k: keyof typeof dict, lang: Lang) => dict[k][lang];

const Index = () => {
  const [lang, setLang] = useState<Lang>("hi");
  const [tab, setTab] = useState("new");
  const [refresh, setRefresh] = useState(0);

  const labelCls = lang === "hi" ? "font-devanagari" : "";
  const bump = () => setRefresh(k => k + 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 p-2 rounded-lg">
              <Gem className="w-7 h-7" />
            </div>
            <div>
              <h1 className={cn("text-2xl font-bold leading-tight", labelCls)}>
                {lang === "hi" ? "खुशी ज्वैलर्स" : "Khushi Jewellers"}
              </h1>
              <p className={cn("text-xs opacity-90", labelCls)}>
                {lang === "hi" ? "बाड़ी पहाड़ी, बिहार शरीफ, बिहार 803118" : "Bari Pahari, Bihar Sharif, Bihar 803118"}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLang(l => (l === "hi" ? "en" : "hi"))}
            className="font-medium"
          >
            <Languages className="w-4 h-4 mr-2" />
            {lang === "hi" ? "English" : "हिंदी"}
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="new" className={labelCls}>{T("newSlip", lang)}</TabsTrigger>
            <TabsTrigger value="records" className={labelCls}>{T("records", lang)}</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <SlipForm lang={lang} onSaved={() => { bump(); }} />
          </TabsContent>

          <TabsContent value="records">
            <RecordsView lang={lang} refreshKey={refresh} onChange={bump} />
          </TabsContent>
        </Tabs>

        <p className={cn("text-center text-xs text-muted-foreground mt-8", labelCls)}>
          {T("localNotice", lang)}
        </p>
      </main>
    </div>
  );
};

export default Index;
