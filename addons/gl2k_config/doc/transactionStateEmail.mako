


<div style="font-family: Arial, Verdana, sans-serif; font-size: 14px;">

    <h2>
        Hallo ${object.partner_id.name}!<br>
    </h2>
    ------
    <p>
      % if object.partner_id.gender == 'male':
      Sehr geehrter Herr
      % elif object.partner_id.gender == 'female':
      Sehr geehrte Frau
      % elif object.partner_id.gender == 'other' or '':
      ''
      % endif
      ${object.partner_id.titel_web or ''} ${object.partner_id.firstname or ''} ${object.partner_id.lastname or ''},
      </p><br>

    -------

    <p>Mit Ihrer Spende von ${object.amount_total}&nbsp;${object.pricelist_id.currency_id.name} machen Sie es möglich, dass wir gemeinsam weiterhin für das Schöne kämpfen - Danke für Ihre Unterstützung!
    </p>
    <h3>Ihre Spende:</h3>
    <p style="padding-left: 14px;">
        Transaktionsnummer: <strong>${object.name}</strong><br>
        Summe: ${object.amount_total}&nbsp;${object.pricelist_id.currency_id.name}<br>
        Datum: ${object.date_order}<br>
        Fortschritt: <strong style="text-transform:uppercase;">
% if object.payment_tx_id.state == 'cancel':
      abgebrochen
% elif object.payment_tx_id.state == 'draft' or '' or 'pending':
      in Bearbeitung
% endif
</strong>
    </p>

    <h3>Sie haben Fragen zum Thema Spenden?</h3><p>Häufig gestellte Fragen und Antworten zu den Themen Spende, Spendenabsetzbarkeit oder der Arbeit von GLOBAL 2000 finden Sie <a href="https://www.global2000.at/faq#spenden">auf unserer Website.</a>
<br>Bei weiteren Fragen können Sie uns per E-Mail an <a href="mailto:service@global2000.at">service@global2000.at</a> erreichen.<br>
Bei spezifischen Fragen zu Ihrer Spende halten Sie bitte Ihre Transaktionsnummer bereit.
</p>
<h3>Bleiben Sie informiert!</h3>
    <p>Bleiben Sie informiert und folgen Sie uns auf <a href="https://www.instagram.com/global2000.at/">Instagram</a>, <a href="https://twitter.com/global2000">Twitter</a>, <a href="https://www.facebook.com/global2000">Facebook</a> oder <a href="https://www.youtube.com/user/UmweltGlobal2000">YouTube</a>.<br>Haben Sie unseren Newsletter abonniert? <a href="https://www.global2000.at/newsletter">Melden Sie sich hier an</a>.</p>
<p>Herzlichen Dank im Namen der Umwelt!<br><br>Ihr GLOBAL 2000 Team</p>
   <p>
        <strong>GLOBAL 2000</strong><br>
        % if object.company_id.street:
            ${object.company_id.street}<br>
        % endif
        % if object.company_id.city or object.company_id.zip:
            ${object.company_id.zip} ${object.company_id.city}<br>
        % endif
        % if object.company_id.country_id:
            ${object.company_id.state_id and ('%s, ' % object.company_id.state_id.name) or ''} ${object.company_id.country_id.name or ''}<br>
        % endif
        % if object.company_id.phone:
            Tel.:&nbsp;${object.company_id.phone}<br>
        % endif
        % if object.company_id.email:
            E-Mail.:&nbsp;<a href="mailto:office@global2000.at">office@global2000.at</a><br>
        % endif
        % if object.company_id.website:
            Web.:&nbsp;<a href=" ${object.company_id.website}" =""="">${object.company_id.website}</a><br>
        % endif
        % if object.company_id.logo:
            </p><div style="padding:0; margin:0;"><img src="data:image/png;base64,${object.company_id.logo}" style="width: 120px;"></div>
        % endif
    <p></p>

</div>
