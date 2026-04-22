# Email Setup - Resend

## Creare account Resend

1. Vai su [resend.com](https://resend.com) e registrati

2. Aggiungi il tuo dominio `kykos.it`:
   - Dashboard → **Domains** → **Add Domain**
   - Inserisci `kykos.it`

3. Resend ti fornirà i record DNS da configurare sul tuo registrar:
   - **MX records** per la ricezione (opzionale per ora)
   - **SPF record** per l'autenticazione
   - **DKIM record** per la firma crittografica

4. Dopo la verifica del dominio, vai su **API Keys** → **Create API Key**

5. Copia la chiave (formato: `re_xxxxxxxxxxxx`)

6. Aggiungi al file `.env`:
   ```
   RESEND_API_KEY=re_la_tua_chiave
   ```

## Dominio già verificato su altro provider?

Se usi Google Workspace o altro provider per le email MX, puoi comunque usare Resend solo per l'invio. Devi comunque aggiungere i record SPF/DKIM per l'autenticazione.

## Record DNS da aggiungere (presso il tuo registrar)

```
TIPO    NOME        VALORE
SPF     @           v=spf1 include:resend.io ~all
DKIM    resend      (valore fornito da Resend)
```

## Testare l'invio email

Dopo aver configurato la API key, le email verranno inviate automaticamente quando:
- Un donatore pubblica un nuovo oggetto
- Un ricevente richiede un oggetto
- Un oggetto diventa disponibile per il ritiro
- Una donazione viene completata

## Templates email implementati

- `sendRequestNotification` - Notifica al donatore di nuova richiesta
- `sendObjectAvailableNotification` - Notifica al ricevente che l'oggetto è disponibile
- `sendQrCodeNotification` - Invio QR code per il ritiro
- `sendDonationConfirmedNotification` - Conferma donazione completata
