$(document).ready(async function () {
    
    console.log(document.location.pathname)
    if(document.location.pathname.endsWith('/app/dashboard')){

        const resultsPerPage = 5;
        let currentPage = 1;

        const account = await fetch('/api/statements',{
            method:"GET",
        })

        let response = await account.json()
        if(response.logout) return document.location.href = "/logout"
        
        data = response.pays;

        function renderResults() {
            const resultsContainer = document.getElementById('StatementList');
            if(!resultsContainer) return
            resultsContainer.innerHTML = '';

            const start = (currentPage - 1) * resultsPerPage;
            const end = start + resultsPerPage;
            const currentResults = data.slice(start, end);

            currentResults.forEach((key) => {
                resultsContainer.innerHTML += `
                    <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">Pix</td>
                        <td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">${parseFloat(key.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">Venda</td>
                        <td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">${new Intl.DateTimeFormat('pt-BR').format(new Date(key.createdAt))}</td>
                        <td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">
                            <button onclick="loadStatement(${key.payment_id})" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                </svg>
                            </button>
                        </td>
                    </tr>
                `;
            });

            renderPagination();
        }

        function renderPagination() {
            const paginationContainer = document.getElementById('pagination');
            paginationContainer.innerHTML = '';

            const totalPages = Math.ceil(data.length / resultsPerPage);

            const createPageButton = (page, text, disabled = false) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-1';
                if (disabled) a.classList.add('disabled');
                a.textContent = text;
                a.href = '#';
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!disabled) {
                        currentPage = page;
                        renderResults();
                    }
                });

                if (page === currentPage) {
                    a.classList.add('active-page');
                }

                li.appendChild(a);
                return li;
            };

            paginationContainer.appendChild(createPageButton(currentPage - 1, 'Previous', currentPage === 1));
            
            for (let i = 1; i <= totalPages; i++) {
                paginationContainer.appendChild(createPageButton(i, i));
            }

            paginationContainer.appendChild(createPageButton(currentPage + 1, 'Next', currentPage === totalPages));
        }

        renderResults();
    }

    $('#loginForm').submit(async function(e){
        e.preventDefault();
    
        const mail = $("#email").val()
        const password = $("#password").val()
    
        if(!mail || !password || password.length < 6)
            return alert("Usuário/Senha inválido")
    
        let loginAction = await fetch(`/api/login`,{
            method:"POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({mail,password})
        })
        loginAction = await loginAction.json()
        if(loginAction.waiting) return $("body").html(`
            <div class="flex flex-col min-h-[100dvh] bg-gradient-to-b from-gray-950 to-gray-950 text-white">
            <header class="bg-electric-violet px-4 lg:px-6 h-14 flex items-center justify-center bg-gray-800">
                <a class="flex items-center justify-center" href="#">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-6 w-6"
                >
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
                </svg>
                <span class="sr-only">Checkout</span>
                </a>
            </header>
            <main class="flex-1 bg-gradient-to-b from-gray-800 to-gray-950 flex items-center justify-center">
                <section class="w-full max-w-md space-y-10 px-4 md:px-6 flex flex-col items-center">
                <div class="space-y-2 text-center">
                    <h1 class="text-3xl font-bold tracking-tighter sm:text-5xl">Aguardando Ativação</h1>
                    <p class="text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Seus dados estão sendo analisados para aprovação de cadastro, Enviamos um e-mail para você, verifique na sua caixa de spam
                    </p>
                </div>
                <div class="flex flex-col items-center justify-center space-y-4">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-16 w-16 text-gray-400"
                    >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p class="text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-center">
                    Aguarde enquanto analisamos suas informações.
                    </p>
                    <div class="w-full ">
                    <a href="./"
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full"
                        color="purple"
                    >
                        Voltar para a página inicial
                    </a>
                    </div>
                </div>
                </section>
            </main>
            </div>
            `)
        if(!loginAction.success) return alert(loginAction.message)
        return window.location.href = './dashboard'
    })
    
    $('#generateCredentials').submit(async function(e){
        e.preventDefault();
        let credentials = await fetch(`/api/company/credentials`,{
            method:"POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({status:'generate'})
        })
    
        credentials = await credentials.json()
        if(!credentials.success) return alert(credentials.message)
        alert("Credenciais geradas com sucesso")
        $("#credentials").val(`${credentials.credential}`)
        document.getElementById("credentials").type = 'text'
    })

    async function showCredentials(e) {
        e.preventDefault();
        let credentials = await fetch(`/api/company/credentials`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'get' })
        });
        credentials = await credentials.json();
        if (!credentials.success) return alert(credentials.message);

        $("#credentials").val(`${credentials.credential}`);
        document.getElementById("credentials").type = 'text';
        toggleButton('hide');
    }

    function hideCredentials(e) {
        e.preventDefault();
        document.getElementById("credentials").type = 'password';
        document.getElementById("credentials").value = '="**********************************************************************"';
        toggleButton('view');
    }

    function toggleButton(action) {
        const buttonHTML = action === 'hide' ? `
            <form id="hideCredentials">
                <button style="background-color:#18181b; color: #fff;" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Esconder
                </button>
            </form>
        ` : `
            <form id="viewCredentials">
                <button style="background-color:#18181b; color: #fff;" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Visualizar
                </button>
            </form>
        `;
        $(".buttonCredentials").html(buttonHTML);
        bindEvents();
    }

    function bindEvents() {
        $('#viewCredentials').submit(showCredentials);
        $('#hideCredentials').submit(hideCredentials);
    }

    bindEvents();
});

async function loadStatement(payment_id){
    $("#loading").show()

    setTimeout(() => {
        $("#loading").fadeOut(500)
        document.location.href = `./details/${payment_id}`
    }, 1000);
}

function moveFocus(currentInput, direction) {
    if (currentInput.value.length === 1 && direction === 'next') {
        const nextInput = currentInput.nextElementSibling;
        if (nextInput && nextInput.tagName === 'INPUT') {
            nextInput.focus();
        }
    } else if (currentInput.value.length === 0 && direction === 'prev') {
        const prevInput = currentInput.previousElementSibling;
        if (prevInput && prevInput.tagName === 'INPUT') {
            prevInput.focus();
        }
    }
}

async function validateTOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    let otpCode = '';
    inputs.forEach(input => {
        otpCode += input.value;
    });
    if(!otpCode.length == 6)
        return alert("ivalid OTP")

    let otp = await fetch(`/api/otp/${otpCode}`,{
        method:"POST"
    })
    otp = await otp.json();
    if(!otp.success)
        return alert(otp.message)

    $(".optinfo").html("OTP Registred")
    $("#replaceCrs").css('color','#4ADE80')
    $("#replaceBors").css('background','#4ADE80')

}


async function gerarTOTP() {
   $("#loading").show()
    let otp = await fetch(`/api/otp`,{
        method:"GET"
    })
    otp = await otp.json();

    $("#replaceCrs").css('color','#FACC15')
    $("#replaceBors").css('background','#FACC15')
    $("#replaceCrs").html("Pendente")
    $(".optinfo").html(`
        <div class="flex items-center justify-center">
            <div class="h-50 w-50 rounded-md ">
            <img
                src="${otp.qrcode}"
                alt="QR Code"
                width="128"
                height="128"
                class="h-full w-full object-contain"
                style="aspect-ratio: 128 / 128; object-fit: cover;"
            />
            </div>
        </div>
        <div class="flex flex-col items-center">
            <label for="code" class="block text-sm font-medium text-gray-700 dark:text-black mb-2">
            Insira o código
            </label>
            <div class="mt-1 w-full max-w-xs" style="display:flex;justify-content:center;">
            <noscript></noscript>
            <div
                data-input-otp-container="true"
                class="flex items-center gap-2"
                style="position: relative; cursor: text; user-select: none;"
            >
                <div class="flex items-center">
                <input
                    id="input_otp"
                    type="text"
                    maxlength="1"
                    class="h-10 w-10 text-center text-lg otp-input"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    oninput="moveFocus(this, 'next')"
                />
                <input
                    id="input_otp"
                    type="text"
                    maxlength="1"
                    class="h-10 w-10 text-center text-lg otp-input"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    oninput="moveFocus(this, 'next')"
                />
                <input
                    id="input_otp"
                    type="text"
                    maxlength="1"
                    class="h-10 w-10 text-center text-lg otp-input"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    oninput="moveFocus(this, 'next')"
                />
                <input
                    id="input_otp"
                    type="text"
                    maxlength="1"
                    class="h-10 w-10 text-center text-lg otp-input"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    oninput="moveFocus(this, 'next')"
                />
                <input
                    id="input_otp"
                    type="text"
                    maxlength="1"
                    class="h-10 w-10 text-center text-lg otp-input"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    oninput="moveFocus(this, 'next')"
                />
                <input
                    id="input_otp"
                    type="text"
                    maxlength="1"
                    class="h-10 w-10 text-center text-lg otp-input"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    oninput="moveFocus(this, 'next')"
                />
                </div>
            </div>
            </div>
        </div>
        <br>
        <section id="section">
            <button style="background-color:#18181b; color: #fff;" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" onclick="validateTOTP()">
                Ativar 2FA
            </button>
        </section>
    `)
   $("#loading").fadeOut(500)

}

document.addEventListener('keydown', (event) => {
    const currentInput = document.activeElement;
    if (currentInput.classList.contains('otp-input')) {
        if (event.key === 'Backspace') {
            moveFocus(currentInput, 'prev');
        }
    }
});

if(document.location.pathname.endsWith('/app/pix')){

    document.getElementById('value').addEventListener('input', function (e) {
        let value = e.target.value;
        value = value.replace(/\D/g, '');
        value = (value / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
        e.target.value = value;
    });

    document.getElementById('pixkey').addEventListener('blur', function (e) {
        const value = e.target.value;
        const errorDiv = document.getElementById('pixkey-error');
        const infoDiv = document.getElementById('pixkey-info');
        errorDiv.textContent = '';
        infoDiv.textContent = '';

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone = /^\+?[1-9]\d{1,14}$/.test(value);
        const isCPF = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(value) || /^\d{11}$/.test(value);
        const isCNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/.test(value) || /^\d{14}$/.test(value);
        const isRandomKey = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);

        let tipoChave = '';

        switch (true) {
        case isEmail:
            tipoChave = 'E-mail';
            break;
        case isPhone:
            tipoChave = 'Telefone';
            break;
        case isCPF:
            tipoChave = 'CPF';
            break;
        case isCNPJ:
            tipoChave = 'CNPJ';
            break;
        case isRandomKey:
            tipoChave = 'Chave aleatória';
            break;
        default:
            // errorDiv.textContent = 'Formato de chave PIX inválido';
            return;
        }

        // infoDiv.textContent = `Chave válida: ${value} (${tipoChave})`;
    });

    document.getElementById('transfer-form').addEventListener('submit', function (e) {
        e.preventDefault();
        
        const pixkey = document.getElementById('pixkey').value;
        const value = document.getElementById('value').value;
        const commits = document.getElementById('commits').value;
        const twoFA = document.getElementById('2fa').value;
        const terms = document.getElementById('terms').checked;

        if (!terms) {
        alert('Você deve concordar com os termos e condições.');
        return;
        }

        // Aqui você pode enviar os dados para o servidor ou processar conforme necessário
        alert(`Dados enviados:
        Chave PIX: ${pixkey}
        Valor: ${value}
        Comentário: ${commits}
        2FA: ${twoFA}
        `);
    });
}
if(document.location.pathname.endsWith('/app/register')){
    function formatCurrency(value) {
        value = value.replace(/\D/g, '');
        value = (value / 100).toFixed(2) + '';
        value = value.replace('.', ',');
        value = 'R$ ' + value;
        return value;
      }
  
      function formatCPF(value) {
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
      }
  
      function formatCEP(value) {
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        return value;
      }
  
      document.getElementById('income').addEventListener('input', function (e) {
        e.target.value = formatCurrency(e.target.value);
      });
  
      document.getElementById('cpf').addEventListener('input', function (e) {
        e.target.value = formatCPF(e.target.value);
      });
  
      document.getElementById('cep').addEventListener('input', function (e) {
        e.target.value = formatCEP(e.target.value);
      });


  
      document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const form = e.target;
        const formData = new FormData(form);
  
        try {

            if($("#password").val().length < 6){
                return alert("Enter a password longer than 6 digits")
            }

            $("#loading").show()
            const response = await fetch('/api/register', { 
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            
            if(response.status !== 200){
                $("#loading").fadeOut(500)
                return alert(result.message)
            }
            
            setTimeout(() => {
                $("#loading").fadeOut(500)
                return document.location.href = "./"
            }, 1500);


        } catch (error) {
            return alert('contact support')

        }
      });

}