// Sanwitch Connect PWA App Framework Bundle Exporter
// Premium Fixed-Layout PWA Runtime (Stunning Cyber-Glassmorphism UI)

export const generateCompleteStandaloneAppHtml = (appName = 'Sanwitch App', widgets = [], wifiIP = '192.168.4.1') => {
  const cleanAppName = (appName || 'Sanwitch App').replace(/"/g, '&quot;');
  const widgetsJson = JSON.stringify(widgets || []);
  const wifiIpVal = wifiIP || '192.168.4.1';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${cleanAppName} - Sanwitch PWA</title>
    <meta name="theme-color" content="#0b0d12" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${cleanAppName}" />
    <link rel="icon" href="data:image/jpeg;base64,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" />
    <link rel="apple-touch-icon" href="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxIQEhITExMVFRUWFxcYGBcYFhcaGBUWFxcXFx4VFhUbHSggHiYxHBcVIT0tJSkrLjIvFx83RDM4NygtLysBCgoKDQ0NDw8PDjcZFRk3KystKzcrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIANkA6QMBIgACEQEDEQH/xAAcAAEAAgIDAQAAAAAAAAAAAAAABwgFBgEDBAL/xABFEAABAwIEBAMECAMGAwkAAAABAAIDBBEFBiExBxJBURNhcSIjMoEUQlJikaGxwTNT8BUkNENy0aKy8QhjgpOUo8LS4f/EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAwDAQACEQMRAD8AnFdNVVxxAGR7WAkNBc4NBcdmgnqey4rakQxySOBIY1zyGi7iGguIa3qdNlq8zqHMdA5rXF0bjva0kMo2Jadjr6EE9Cg9mdcBkrIWugldDUwu8SB4JAD7EFrxsWkaG4P7HFZEz2KxzqWqb4FdES18Z0Dy3d0f62ud7i41WDytmifCpxhuKG7dqeqPwvZsGucemwudWnQ9HHLcSci/TgKmm9isjsWuB5fFDdQ0uGxHR3TbbYN9BXKjHhzxIM7hR13u6pp5GvcOUSuGnK8fVk8tj010UnICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIuLrlBruW82w1r5YS10NRE4iSCS3O2xtzC2jm7G47jyvpmbcvT4RO7FMNbdh/wATTfUczcuDRsNzpq0m405gs3xFyY6qDKukJiroNY3tIaZAL+7ce+ptfTUg6Er44dZ/biANPUARVbAQ5hFhJy6Ocxp2I1u3ca9EHpeyhzJQ9wfTxaeW366+jh5FatlrNFRgs4w7EzeH/IqTflDNhdx+p011YdDpYj5zXgM+B1BxLDx/d3f4iD6obfew+pqTfdh+6SBtrm0GY6EHcHY6CWnmtt5H8nA9QUGL4mcPm4g01NMAKlovYEBs7RsCejtrH5HoRguHPEtzHCixFxa4HkZM/Qgg28Ke+x6B3yPc9eW8y1OATjD8Ru6m/wAmaxsxmwc07lm1xuz0sth4j8P48SZ9JpuUVHKDcEclQ22gJ2vbZ3yOlrBIoN1yoH4e8RpcPf8AQ67n8JruQOcDz0xGnI8HUs/NvptOkEzXta5rg5rgCCCCCCLggjcWQdiIiAiIgIiICIiAiIgIiICIiAiIgIvFiuLQUkZlnlZEy9uZ7gBfsO58gobzbxillDo6FpiaR/GeB4l7/UZq0aD61zqdAgl7G8fpqJofUTMiBuBzGxcQL2aNybdlGePca2C7aOAvPLpJNdrQ6/WJupFvvBQ9WVckz3SSvc97iS5zjcklbTw8yNJist3czKZh95J1cf5cZ79z09SEGzZUkxXHqkzPqZaemY72jC50bNLe6iAOp6kuLrX9Apf/ALGj+1N/6if/AO69GG0EVNEyGFgZGwWa0bAf1rfqvUgEKLuKmRXyn+0KIFtTHZz2s0dJy7SMt9cAf+IabgXlFcEII84a8QGYkz6PUcrakN205Z221c0d+7fmNL21vM2CVGXqk19AOaleQJYbnlYL/A7s25PK76pNtjr9cVsiOhecRogWlp55Ws0LHDXx47bfeA9erlsfDnPMeKxGmqQ36QGkOaQOWdlrFzQdNt2/PbYMm9tDmKh6lp2Oglp5QPycL+jgeoKj/AMfqsu1Ioq0F9K65jeASGtJ/iRfd19pm4JuOnN84/hVTlqq+l0d30chAcxxPK25/gyHp15X9NjfZ0hyR0OYqEdWnY6CSnlA/Ii9uxB6goMXn7I8OLxNqqVzBPyAskB9idltGvI/J3T0Ub5GzvUYNM6mqGPMAcRJCfjgcTq6MfO5Gxvcam7sjguM1eWqo0tUDJSvJcC29i2/8aC+3TmZ3+RdvmcsoU2N07KiB7PGLbxTD4ZG6+7ktrbfzab+YIbnheJRVMbJYXtkjeLtc3Y+XkeljqF61WbLmYq3Aqp8bmOADvfU7zYO++w7A22cLgjvorBZZzHT4hCJoHXGzmnR8bvsvb0P5Hogy6IiAiIgIiICIiAiIgIi6aqpZExz5HNYxou5ziA0DuSdAg7SVoeeeJlPh/NFFaao9oFrSOWJwAt4p9SNBrodlpPEHiq+fnp6ElkftMfNaz362vC4O9kWB1Opv0UWucSSSbk6knck9SUVksfzBU10hlqJS8m1m3IjZYW9iO9m6dvNYxFt3D3I0uKyXN2UzD7yTq4/y4/PuenrYIOeHmRpcUlu67KZh95J1cf5cfn3PT1sFY7DaCKniZFEwMjYOVrRsAmG0EdNGyKJgZGwWa0bAL0ogiIgIiIOHNuLFQLxNyQ/DZhXUZc2HnDvY+KmlJ0LfuE/he2xCntdVTTtlY5j2hzHAtc1wBDmkWIIO4sg0PIWcYcZp301S1nj8hEsZHszMOhkYO2ouOh8rFaNi2HVeWKwT05MlJI61nbOGp8GU9HAXLXb6f6gcZnzKU2CVTJ6ZzhCX80MgN3Qv1PhOJ30va/xNuDfW8o5PzNTY9SyQTsb4nLaaE7EdJI+tr2N92n5IPfJHQ5hoe7HbEWEkEoH5OH4EdwVFmF4nWZZqzBODJTPN7D4ZG7eNDf4XbXafT7LlxX01XlitEkZMlNKbC/wysGvhyW2e0XIPzGhcBnuJOeMNr8O5WHxJ3FpYwtIfA4EcznG1hpzDQ+1fsg6OL+O4ZW0sL4ZY5anmbyFnxsjOrmyjp6HW/zUb5azBPh87Z4HWI0cw/BKzqx4/fcHVYtEVa/K2PxYhTR1EWztHNPxMeN2O8wfx0PVZdQDwLxow1rqYn2KhhIHaWMFwIHmznB78reyn5EEREBERAREQERa/nDNtPhkRkmcC8/BEHN8STUD2Wk7C+p2CD349jcFFC6ed/JG21zYkkk2Aa0ak3KrxnvPs+JvLdY6cH2YgT7dnXD5e50Gmwt81ic15knxKbxp3XtcRtAs2NhcTyjz1FydTb0WHRREW3cPMjyYrLc3ZTMNpJOrj/Lj+93PQH0QOHuRpcVlubx0zDaSTq47+HHfr3Owv3VjsNw+KmiZDCwMjYA1rRsAP19dymG4fFTRMhhYGRsFmtGwH7nrfckr1IgiIgIiICIiAiIg8OM4VFVwyQTMD43izh+YIPQggEEbEBVyzBhFVgNcx0byC0l0EttJGbFrhsdDZw8x3Cs2sJm7LcOJU7oJR5sePijeL2e38SLdQSEEY5n4nUddhkkLonfSZGcpjLSWxyfzGyHQgHUdfLdREslmLApqCd0E7bOGoP1Xt6PYeo/TZY1FEREVsPDyYMxOhcTYeMBf/WHMt+LlaVU7ilcxzXNNnNcHNPZzSCD+ICtdlbGmV1LBUs2kaCR9l40cw+jgR8kSssiIiCIiAiLTOIue48Lj5W2fUyNPhsIu0WIHPLYgga7bm3qQHfn3O8OFxi/tzvF4odRz2IBc5wBDQL9d7aKuuO4zPWzOmneXuN7XOjG3JDGjoBcroxPEJamV80zy97ySSb6XN+VoOwHQdF5kURFt3D7I0uKS3N2UzD7yTq4/y4+57nYfkgcPcjy4pLc3ZTMPvJPtH+XH3Pc7D1sDY7DMPipomQxMDI2CzWgaAf1r80wzD4qaJkULAyNgs1o2AXqRBERAREQEREBERAREQEREGEzVlamxKLwp2Xtcse3R8bu7Hfsbg9QoXx/hBXwOJp+Wpj6WIZJ6Fjjy/g75BWDRBVWoybiMYJdRVAA3tGXf8t1hHtIJBBBG4IsR6g7K4llhsx5Vo8Qbaoga82sH/DI3/TIPaH42RdVTUlcFs3fRZzRyutFO67CfqTaC3o4AD1A7roztwqqKIOlpi6ogFyRb30Y82ge2PNuvl1UdgoLjoo84TZ4FdD9Hmd/eYm6k7zRjQSDudg7z16qQ0QRcEqPs5cUaWmheKaRk85c+MBpFonNB94/uAbev4oPXxIz5HhsZYyz6l4PI0WIjNtJJRe9tdB1t21Vd6+sfPLJNI4ukkcXPcbauPpt29ErqySeR8sry+R5u5xtdx0FzbToB8guhFEXC27h7keTFZbm7KZh95J1J/lx/e/QH0uDh9kaXFZbnmZTMPvJANSf5cf3ttdhf5Kx+GYfFTRMhhYGRsFmtGwH7nzTDMOipomQwsDI2CzWjYD9ze5JOpJK9SIIiICIiAiIgIiICIiAiIgIiICIiAiIgFRrxC4Xx1nPPShsVQblzdo5jv7X2XefXr3UlIgqPFJUUFQHAOhqIX7EWcxw6EdQQfQg9irH5CzjFikHOLNmZYSxX1a77Te7T0PqNwV05/wAiw4pHfSOoaPdygf8AA8dW/mOnnAsEtZgtZexiniOrTqyRh6dnMPf9CNA37itxHLy+io3ENF2zzNPxHYxRntuCR6DqojClPMeBw45AcRw9tqlo/vNNpzONviH3tDY7OA6EWUWn+v8AayKIi23h9keXFJbm7KZh95J1P/dx93eew/AEHD3JEuKS3N2UzD7yTudD4cfcnvsB52BsfhmHxU0TIYWBkbBZrRsB+5636phmHxU0TIYWBkbBZrRsB+/qvUiCIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiL5e8AEk2AFyTsB3JQckqL8y12F47M+gEnLURg+BUWHK6TXmjY6/tjQXHXUjVtxrXE7iWarmpaN5EOoklGhm7tYfsef1v8ATvGDHEEEEgggggkEEaggjY3F0VsNPNW4FWn6kzPibvHNGT/xNNtDuCOhBW4ZgwGDHIXYhhw5akf4im0u51viA+12OzrdDdfWDYnBmGBtFWODK6ME09RYe9sNQe509pvUDmGo00eCeswasNrxTxGzmnVsjDrY/bYdx+xGgZLIGRZsUlPNzR08brSvtZ1xvEwEfF3v8P5Kx2GYdFTRMhhYGRsFmtGwH7nzO61/IecKfE4i6MCOVussOl2ucdXD7TSb+15663C2pEEREBERAREQEREBERAREQEREBERAREQEREBEXVVVDImOe9wa1oJc5xsGgbklBzNK1gLnENABJJIAAGpJJ2CgPihxHNaX01M4tpRo9+xnt+jP+brpv08SuIj8Qc6CAllKDqdnTkdXdm9h8z2EfFFb2OFOIfRfpNo78nP4PMfF5bXtty81ul/LdaIDfVSy3jQ8Unh/R/7zycvicw8K9reJy/Ffry/mtIyNk6bE5hHHdsTLeLKRcMb2Hd56D5nTcO/h/lGfEqhvhl0ccTmukmGhYQQ4NjP29rdtz0vN2f8jx4nAALNqIx7qU7n7khG7T+R1Ww4Hg8NFCyCBnJGwaDqT1c49STqSveiKlQy1OHVNwXQVELiD3B6tcNnAi3cEW8lYDh9xAhxNvI60dS0XdHfR4G74r7juNx6WJ83FDITcRj8aEBtVGPZ6CZo/wAtx79j0OmxVfY5JIJA5pfHLG7Qi7XxvabeoINx+KC4CKM+HHE1lZy01UWx1GzX7Mn9Psv8tj07CTEBERAREQEREBERAREQEREBERAREQEReXEsQipo3yzPDI2C7nO2A/c9LDUoPqurI4I3yyOaxjAXOc42DQOpKrxxHz/JibzFFdlK06N1DpiNnyDt1DemhOtuXp4h58lxSTlbeOmYbsj6vI2klt17Dp66rTkURFnMnZXmxOcRRaNFjJIR7MbT1PcnWw62PYoPvJeU5sUn8OP2Y22MsttI2+Xdx6D9lZbAMFhoYGQQM5WN/FxO73nqSdbr5y5gUNBAyCBtmt3P1nuO73nqT/8AmwAWTRBERAKini/kLxw6upm+9aLzRtH8Vo+u0D6wH4gdwFKy4IQU5B6/MH9wVLnDjioY+Wmr33boGVB3b92buPvfj3Xj4wZE+jONbTs9y8++YP8AKe4/xAPsknXsT2OkYIq4kbw4Agggi4I1BB6gr6VceH/EWbDS2KXmlpb/AA39qHziJ6fd27W62BwfFYauJk0DxJG4aOH5gjcEbEHUIj2oiICIiAiIgIiICIiAiIgIixuPY3BQwvnneGMb+LidmtHUnsg7cZxWGkhfPO8MjYLkn8gBuSdgBuq4Z8zvNismt44GH3cV/lzyW3db5DYdSenPGcZ8Vm5n3ZEwnwogdGjbmd3cR16bDrfW0URFlssZdnxGdsEI1Or3n4YmdXv/AGG5P4gPvKeWp8SqBDCNNDJIfhiZ9p3nuANyfIEiy2WMvQYfA2CBtmjVzj8Ujzu956n9AANgvjKeWoMNgbBCPN7zbmkfaxe8/wBADRZpEEREBERAREQdVRA2RrmPaHNcC1zSLggixBHoq28ScmOwuo9gE00pJidvyncwuPcdO49CrLrG5hwWKugkp5m3Y8fNpGz2noQdUFS1nMqZqqcMk8SB3sm3PE74JAO46G2xGo9NF58zYBNh9Q+nmHtN1a4D2ZGHZ7fXt0II6LFoq0OTM6U2KR3iPLI0e8hd8bPP7zfMaeh0WyqoFDWyQSNlie6ORpu17TYj/f0OhU48P+KkdXywVnLFPoGv2jlP/wAHeR0PQ9EEnIuLrlEEREBERAREQERYTNmZ4MNgM0zvJjBbnldb4WD99gNUHbmXMEGHwOnndZo0DR8T3dGMHU/9dlW7OWbJ8Tm8SU8rG3EcQPsxj93Hqf0Gi6c15lnxKczTna4ZGCeSJp+q38rnc29AMMiiIvfgWDzVs7IIG8z3fg1o3e49AEHZlzAp6+dsEDbudqSfhY3q956AfnsrK5PytDhkAhiFydZJDbmkf9p37DYBdeScpQ4ZAI4/ae6xlltYyO/YDWw6epJOxICIiIIiICIiAiIgIiINR4j5ObidPZthPHd0Lzpr1jcfsm3yNj0Vap4XRucx7S17SWuaRYtcDYgj1Vw1EnGjJPiNdiEDfbYPftH14x/m27tG/wB3/SghRcELlEaSJkLijNRcsNVzT0+gDt5Yh5E/G3yOo6G2inTCMWhq4mzQSNkjds5p69QRuD5HUKo6ymXcxVOHyeLTSFhPxN3ZIOz2bH13HQhEWyRapkHO0OKxEgckzLeLETctv9Zp+s09/kVtaIIiICIiDEZqx6PD6aWok1DBo0bveTZrB6n91WTMuPz4hO6ed13HRrR8MbfsMHbz3J1Kl/8A7QJd9EpbX5fpHtf+VJa/5qDEVJOWuEktZSMqTUNjdKwPjZyFw5XC7S919Lix0BtdR3V0zopHxvFnsc5jh2c0lp19Qt4y9xWq6OlbTCKKTw28sUji4FjQLAOaPjt6t0A9Vp1NTz1s4awOlmmeTbq5ziXFx6Abk9ALoOMIwyarmZBAwvkebAdAOrnHoB1KslkLJ0WFwcjbPmfYyy21efst7NFzYep3JXVw9yTFhcPR9Q8DxZLf+2zs0fnv2A25EEREBERAREQEREBERAREQFw5oIsVyiCuHFTJn9m1HiRN/u0xJZ2jfuYv3HlcfVWkK2WZcEirqeSnlHsvG/Vjhq17fMGxVW8cwmWjnlp5hZ8brHs4bh7fIix/6FFeFERFZTK+OPw+qhqWG3I72x9qI/G09/Zv8wD0VsInhwBGoIBB7gqnRYXey0XLtAO5OgH4myt9hkBjhiYd2MY0+rWgfsiV6UREQREQYXN+XmYjSyU7zbmsWu6se3Vr7evTqCVWjMWW6qgeWVETm2OjwCY3+bZNvlv5K2K89d8DvRBU3CMKnq3iOnifK4/ZFwPNztmjzJAVhOG+Q2YZHzvs+pePbeNmDfwo79O53JHYADZ8L/h/P/Ze5qDlERAREQEREBERAREQEREBERAREQFpPEnIbMUjD2EMqYxZjz8L27+HJbpe5B6EnoSDuyFBUbGMJno5DFUROif2cNHebXbOHmF4ew77eZ7BWY4nf4CT5/oou4Lf4w/11RWU4VcOJTLHWVjCxjCHRROHtOf0ke07AbgHUkA6W1mxcBcogiIg/9k=" />
    <link rel="manifest" href="data:application/manifest+json;utf8,${encodeURIComponent(JSON.stringify({
    name: appName,
    short_name: appName,
    start_url: '.',
    display: 'standalone',
    background_color: '#0b0d12',
    theme_color: '#38bdf8',
    icons: [
      { src: "data:image/jpeg;base64,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", sizes: "512x512", type: "image/jpeg" },
      { src: 'https://cdn-icons-png.flaticon.com/512/2583/2583271.png', sizes: '512x512', type: 'image/png' }
    ]
  }))}" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
      
      :root {
        --primary: #38bdf8;
        --primary-glow: rgba(56, 189, 248, 0.4);
        --secondary: #14b8a6;
        --secondary-glow: rgba(20, 184, 166, 0.4);
        --background: #0b0d12;
        --surface: rgba(22, 24, 31, 0.75);
        --surface-card: #16181f;
        --surface-border: rgba(255, 255, 255, 0.08);
        --surface-border-hover: rgba(56, 189, 248, 0.3);
        --text: #f8fafc;
        --text-muted: #94a3b8;
        --accent: #f43f5e;
        --success: #10b981;
        --warning: #f59e0b;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; outline: none; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: var(--background);
        background-image: 
          radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 85% 85%, rgba(20, 184, 166, 0.12) 0%, transparent 45%);
        background-attachment: fixed;
        color: var(--text);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      #app { flex: 1; display: flex; flex-direction: column; height: 100vh; }

      header {
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(11, 13, 18, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--surface-border);
        z-index: 100;
      }

      .logo-wrap { display: flex; align-items: center; gap: 12px; }
      .logo-icon {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px var(--primary-glow);
        font-weight: 800;
        color: #0b0d12;
        font-size: 1.2rem;
      }
      
      h1 { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
      .app-tag { font-size: 0.7rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

      .header-actions { display: flex; align-items: center; gap: 10px; }
      
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .icon-btn:active { transform: scale(0.92); border-color: var(--primary); }

      .connection-badge {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--surface-border);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      .connection-badge.connected {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.4);
        color: var(--success);
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        transition: all 0.3s ease;
      }
      .connected .status-dot {
        background: var(--success);
        box-shadow: 0 0 10px var(--success);
        animation: pulse 2s infinite;
      }
      @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

      nav {
        display: flex;
        background: rgba(22, 24, 31, 0.6);
        backdrop-filter: blur(12px);
        margin: 12px 20px;
        padding: 4px;
        border-radius: 16px;
        border: 1px solid var(--surface-border);
      }
      .nav-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-weight: 700;
        font-size: 0.85rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .nav-btn.active {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(20, 184, 166, 0.2));
        border: 1px solid rgba(56, 189, 248, 0.3);
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      main { flex: 1; overflow-y: auto; padding: 8px 20px 80px; position: relative; }
      .view { display: none; opacity: 0; transition: opacity 0.3s ease; }
      .view.active { display: block; opacity: 1; }

      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 6px; }
      
      .card {
        background: var(--surface);
        backdrop-filter: blur(16px);
        border: 1px solid var(--surface-border);
        border-radius: 24px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        position: relative;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        transition: all 0.25s ease;
      }
      .card:hover { border-color: var(--surface-border-hover); transform: translateY(-2px); }
      .card:active { transform: scale(0.98); }
      .card-wide { grid-column: span 2; }
      
      .card-header { display: flex; justify-content: space-between; align-items: center; }
      .card-title { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .card-value { font-size: 2.2rem; font-weight: 800; color: var(--text); font-family: 'JetBrains Mono', monospace; }
      
      .btn-primary {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: #0b0d12;
        border: none;
        padding: 14px 20px;
        border-radius: 14px;
        font-weight: 800;
        font-size: 0.95rem;
        cursor: pointer;
        width: 100%;
        box-shadow: 0 8px 25px var(--primary-glow);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-primary:active { transform: scale(0.96); opacity: 0.9; }

      /* Custom Toggle Switch */
      .toggle-wrap { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
      .toggle-switch { position: relative; display: inline-block; width: 60px; height: 32px; }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .slider-switch {
        position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(255, 255, 255, 0.08); transition: .3s ease;
        border-radius: 32px; border: 1px solid var(--surface-border);
      }
      .slider-switch:before {
        position: absolute; content: ""; height: 24px; width: 24px; left: 3px; bottom: 3px;
        background-color: var(--text-muted); transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      }
      input:checked + .slider-switch { background-color: var(--primary); border-color: var(--primary); }
      input:checked + .slider-switch:before { transform: translateX(28px); background-color: #0b0d12; }

      /* Range Slider */
      .range-wrap { margin-top: 6px; }
      .range-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; }
      .range-input {
        width: 100%; height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 6px; outline: none; -webkit-appearance: none;
      }
      .range-input::-webkit-slider-thumb {
        -webkit-appearance: none; width: 22px; height: 22px; background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-radius: 50%; cursor: pointer; box-shadow: 0 0 12px var(--primary-glow); border: 2px solid #ffffff;
      }

      /* Custom Payload Badge */
      .payload-box {
        background: rgba(0, 0, 0, 0.35);
        border-radius: 12px;
        padding: 10px 14px;
        border: 1px dashed var(--primary-glow);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        color: var(--primary);
        word-break: break-all;
        margin-bottom: 10px;
      }

      /* Color Input Dot Grid */
      .color-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
      .color-dot { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; }
      .color-dot:active, .color-dot.active { transform: scale(1.15); border-color: #ffffff; box-shadow: 0 0 12px rgba(255,255,255,0.4); }

      /* Joystick Pad */
      .joystick-pad {
        width: 160px; height: 160px; border-radius: 50%; background: rgba(0, 0, 0, 0.4);
        border: 2px solid var(--surface-border); margin: 10px auto; position: relative;
        display: flex; align-items: center; justify-content: center; touch-action: none;
      }
      .joystick-handle {
        width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary));
        box-shadow: 0 0 20px var(--primary-glow); position: absolute; transition: transform 0.05s ease;
      }

      /* Terminal Styling */
      .terminal-card {
        background: #06070a;
        font-family: 'JetBrains Mono', monospace;
        padding: 18px;
        height: 320px;
        display: flex;
        flex-direction: column;
        border-radius: 20px;
        border: 1px solid var(--surface-border);
      }
      #terminal-output { flex: 1; overflow-y: auto; font-size: 0.82rem; line-height: 1.5; color: var(--text); margin-bottom: 12px; }
      .terminal-input-row { display: flex; gap: 10px; align-items: center; background: rgba(255, 255, 255, 0.04); padding: 8px 14px; border-radius: 12px; border: 1px solid var(--surface-border); }
      .terminal-input-row input { flex: 1; background: transparent; border: none; color: white; font-family: inherit; font-size: 0.85rem; outline: none; }

      @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } .card-wide { grid-column: span 1; } }
    </style>
  </head>
  <body>
    <div id="app">
      <header>
        <div class="logo-wrap">
          <img src="data:image/jpeg;base64,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" class="logo-icon" style="object-fit: cover; padding: 0;" alt="PWA Icon" />
          <div>
            <h1>${cleanAppName}</h1>
            <div class="app-tag">Sanwitch PWA Runtime</div>
          </div>
        </div>
        <div class="header-actions">
          <button id="voice-btn" class="icon-btn" title="Voice Control">🎙️</button>
          <div class="connection-badge" id="conn-status">
            <div class="status-dot"></div>
            <span id="conn-text">Offline</span>
          </div>
        </div>
      </header>

      <nav>
        <button class="nav-btn active" data-view="dashboard">🎛️ Panel</button>
        <button class="nav-btn" data-view="connect">🔗 Link</button>
        <button class="nav-btn" data-view="terminal">💻 Terminal</button>
      </nav>

      <main>
        <div id="view-dashboard" class="view active">
          <div id="widget-container" class="grid"></div>
        </div>

        <div id="view-connect" class="view">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="card card-wide">
              <div class="card-header">
                <span class="card-title">Bluetooth BLE Hardware</span>
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">WebBluetooth</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Scan and pair directly with ESP32 / Arduino BLE UART hardware.</p>
              <button class="btn-primary" id="ble-scan-btn">
                <span>📡 Scan BLE Devices</span>
              </button>
            </div>

            <div class="card card-wide">
              <div class="card-header">
                <span class="card-title">WiFi Direct IP Connection</span>
                <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">HTTP Control</span>
              </div>
              <div class="terminal-input-row" style="margin: 6px 0;">
                <span style="color: var(--secondary); font-family: monospace;">http://</span>
                <input type="text" id="wifi-ip" value="${wifiIpVal}" placeholder="ESP32 IP Address (e.g. 192.168.4.1)">
              </div>
              <button class="btn-primary" style="background: rgba(255, 255, 255, 0.08); color: var(--text); box-shadow: none;" id="wifi-connect-btn">
                <span>Connect via WiFi IP</span>
              </button>
            </div>
          </div>
        </div>

        <div id="view-terminal" class="view">
          <div class="card card-wide terminal-card">
            <div id="terminal-output">
              <div style="color: var(--primary); margin-bottom: 6px;">⚡ Sanwitch Control Terminal Ready...</div>
            </div>
            <div class="terminal-input-row">
              <span style="color: var(--primary); font-weight: 800;">></span>
              <input type="text" id="terminal-input" placeholder="Type custom payload (e.g. RELAY_1:ON or AT+MODE=1)">
            </div>
          </div>
        </div>
      </main>
    </div>

    <script>
      window.INITIAL_WIDGETS = ${widgetsJson};
      const UUID_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
      const UUID_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
      const UUID_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

      let bleDevice = null;
      let bleCharacteristicRx = null;
      let bleCharacteristicTx = null;
      let widgets = [];

      const widgetContainer = document.getElementById('widget-container');
      const termOutput = document.getElementById('terminal-output');
      const connStatus = document.getElementById('conn-status');

      function loadLayout() {
        if (window.INITIAL_WIDGETS && Array.isArray(window.INITIAL_WIDGETS) && window.INITIAL_WIDGETS.length > 0) {
          window.INITIAL_WIDGETS.forEach(w => addWidget(w.type, w.id || w.name, w.cmd));
        } else {
          addWidget('toggle', 'Power Switch');
          addWidget('slider', 'Speed Control');
          addWidget('gauge', 'Live Sensor');
        }
      }

      function addWidget(type, name = '', customCmd = '') {
        const id = name || (type + '_' + Date.now());
        const cmd = customCmd || (id.toUpperCase() + ':EXEC');
        const widget = { type, id, cmd };
        const card = document.createElement('div');
        card.className = 'card ' + ((type === 'joystick' || type === 'gauge' || type === 'custom') ? 'card-wide' : '');
        card.id = 'widget-' + id;
        
        let cardHtml = '<div class="card-header"><span class="card-title">' + id + '</span></div>';

        if (type === 'toggle') {
          cardHtml += '<div class="toggle-wrap"><span style="font-weight: 600; font-size: 0.9rem;">State Control</span><label class="toggle-switch"><input type="checkbox" onchange="window.sendData(\\'' + id.toUpperCase() + ':\\' + (this.checked ? \'1\' : \'0\') + \'\\\\n\')"><span class="slider-switch"></span></label></div>';
        } else if (type === 'slider') {
          cardHtml += '<div class="range-wrap"><div class="range-header"><span>LEVEL</span><span id="val-' + id + '">0%</span></div><input type="range" class="range-input" min="0" max="100" value="0" oninput="document.getElementById(\\'val-' + id + '\\').textContent = this.value + \'%\'" onchange="window.sendData(\\'' + id.toUpperCase() + ':\\' + this.value + \'\\\\n\')"></div>';
        } else if (type === 'button') {
          cardHtml += '<button class="btn-primary" style="margin-top: 4px;" onclick="window.sendData(\\'' + id.toUpperCase() + ':PUSH\\\\n\')">⚡ TRIGGER ACTION</button>';
        } else if (type === 'gauge') {
          cardHtml += '<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;"><span class="card-value" id="gauge-' + id + '">24.5</span><span style="color: var(--success); font-size: 0.85rem; font-weight: 700;">● Live Feedback</span></div>';
        } else if (type === 'rgb') {
          cardHtml += '<div class="color-grid">';
          ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].forEach(c => {
            cardHtml += '<div class="color-dot" style="background:' + c + '" onclick="window.sendData(\\'RGB:' + c.substring(1) + '\\\\n\\')"></div>';
          });
          cardHtml += '</div>';
        } else if (type === 'custom') {
          cardHtml += '<div class="payload-box">CMD > ' + cmd + '</div><button class="btn-primary" onclick="window.sendData(\\'' + cmd + \'\\\\n\')">🚀 EXECUTE CUSTOM PAYLOAD</button>';
        } else if (type === 'joystick') {
          cardHtml += '<div class="joystick-pad" id="joy-' + id + '"><div class="joystick-handle" id="joy-handle-' + id + '"></div></div><div style="text-align:center; font-size:0.75rem; color:var(--text-muted);" id="joy-text-' + id + '">JOYSTICK (0,0)</div>';
        }

        card.innerHTML = cardHtml;
        widgetContainer.appendChild(card);
        widgets.push(widget);

        if (type === 'joystick') setupJoystick(id);
      }

      function setupJoystick(id) {
        const pad = document.getElementById('joy-' + id);
        const handle = document.getElementById('joy-handle-' + id);
        const txt = document.getElementById('joy-text-' + id);
        if (!pad || !handle) return;

        let active = false;
        const maxDist = 55;

        const move = (e) => {
          if (!active) return;
          const rect = pad.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          let dx = clientX - (rect.left + rect.width / 2);
          let dy = clientY - (rect.top + rect.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
          handle.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
          const jx = Math.round((dx / maxDist) * 100);
          const jy = Math.round((-dy / maxDist) * 100);
          txt.textContent = 'JOYSTICK (' + jx + ', ' + jy + ')';
          window.sendData('JOY:' + jx + ',' + jy + '\\n');
        };

        const stop = () => {
          if (!active) return;
          active = false;
          handle.style.transform = 'translate(0px, 0px)';
          txt.textContent = 'JOYSTICK (0, 0)';
          window.sendData('JOY:0,0\\n');
        };

        pad.addEventListener('mousedown', () => active = true);
        pad.addEventListener('touchstart', () => active = true);
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move);
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);
      }

      window.sendData = async (data) => {
        log('TX: ' + data.trim(), 'tx');
        if (bleCharacteristicRx) {
          try { await bleCharacteristicRx.writeValue(new TextEncoder().encode(data)); } catch(e) { log('BLE Err', 'err'); }
        } else {
          const ip = document.getElementById('wifi-ip').value || '${wifiIpVal}';
          fetch('http://' + ip + '/control?cmd=' + encodeURIComponent(data.trim()), { mode: 'no-cors' }).catch(()=>{});
        }
      };

      function log(msg, type = '') {
        const div = document.createElement('div');
        div.style.color = type === 'rx' ? 'var(--secondary)' : (type === 'tx' ? 'var(--primary)' : 'var(--text-muted)');
        div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
        termOutput.appendChild(div);
        termOutput.scrollTop = termOutput.scrollHeight;
      }

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
          document.getElementById('view-' + btn.dataset.view).classList.add('active');
        });
      });

      document.getElementById('terminal-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const val = e.target.value.trim();
          if (val) { window.sendData(val + '\\n'); e.target.value = ''; }
        }
      });

      // BLE Scanner Trigger
      document.getElementById('ble-scan-btn').addEventListener('click', async () => {
        if ('bluetooth' in navigator) {
          try {
            log('Requesting WebBluetooth device...', 'sys');
            bleDevice = await navigator.bluetooth.requestDevice({
              filters: [{ namePrefix: 'Sanwitch' }],
              optionalServices: [UUID_SERVICE]
            });
            const server = await bleDevice.gatt.connect();
            const service = await server.getPrimaryService(UUID_SERVICE);
            bleCharacteristicRx = await service.getCharacteristic(UUID_RX);
            connStatus.classList.add('connected');
            document.getElementById('conn-text').textContent = 'BLE Connected';
            log('Connected to ' + bleDevice.name, 'sys');
          } catch(e) { log('BLE Error: ' + e.message, 'err'); }
        } else {
          log('WebBluetooth is not supported on this browser.', 'err');
        }
      });

      // Web Speech Recognition
      const voiceBtn = document.getElementById('voice-btn');
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.onstart = () => log('Listening for voice command...', 'sys');
        rec.onresult = (e) => {
          const text = e.results[0][0].transcript.toLowerCase();
          log('Voice: ' + text, 'tx');
          widgets.forEach(w => {
            if (text.includes(w.id.toLowerCase())) {
              if (w.type === 'toggle') {
                if (text.includes('on') || text.includes('start')) window.sendData(w.id.toUpperCase() + ':1\\n');
                if (text.includes('off') || text.includes('stop')) window.sendData(w.id.toUpperCase() + ':0\\n');
              } else if (w.type === 'custom') {
                window.sendData(w.cmd + '\\n');
              }
            }
          });
        };
        voiceBtn.addEventListener('click', () => rec.start());
      }

      loadLayout();
    </script>
  </body>
</html>`;
};
