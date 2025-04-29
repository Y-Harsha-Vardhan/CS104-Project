#Importing Required Modules
from selenium import webdriver
from selenium.webdriver.common.by import By
import time
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random

#Setting Up Edge Driver & Specifying File Path
edge_driver_path = "C:/Drivers/msedgedriver.exe"
service = Service(executable_path=edge_driver_path)
driver = webdriver.Edge(service=service)

driver.get("file:///C:/Users/yhars/CODE/CS104-Project/setup.html")
wait = WebDriverWait(driver, 10)

#=== Filling Setup Page ===
time.sleep(30)
team1_name = driver.find_element(By.ID, "team1")
team2_name = driver.find_element(By.ID, "team2")
toss_winner = Select(driver.find_element(By.ID, "toss-winner"))
toss_decision = Select(driver.find_element(By.ID, "toss-decision"))
numOvers = driver.find_element(By.ID, "overs-input")

team1_name.send_keys("CSK")
team2_name.send_keys("RCB")
toss_winner.select_by_index(0)
toss_decision.select_by_index(0)
n = random.randint(1, 5)  #Number of Overs Range Between 1 and 5
numOvers.send_keys(n)

driver.find_element(By.ID, "start-match").click()

# === Player Names Database ===
CSK_Team = ['Ruturaj', 'Jadeja', 'Rahul', 'Shivam', 'Ravindra', 'Ashwin', 'Rasheed', 'Aayush', 'Curran', 'Pathirana', 'Anshul']
CSK_Bowl = ['Jadeja', 'Pathirana', 'Ashwin', 'Shivam', 'Curran']
RCB_Team = ['Kohli', 'Patidar', 'Siraj', 'Bhuvneshwar', 'Krunal', 'Maxwell', 'David', 'Hazlewood', 'Salt', 'Suyash', 'Manoj']
RCB_Bowl = ['Siraj', 'Bhuvneshwar', 'Hazlewood', 'Krunal', 'Suyash']

# === Player Sets ===
CSK_Batters_Used = set()
RCB_Batters_Used = set()
CSK_Bowlers_Used = set()
RCB_Bowlers_Used = set()

# === Global Variables ===
first_innings = True


# === Helper Functions ===
def fill_starting_players(batters, bowler):
    wait.until(EC.visibility_of_element_located((By.ID, 'name-prompt-modal')))
    inputs = driver.find_elements(By.CSS_SELECTOR, "#name-inputs input")
    inputs[0].send_keys(batters[0])
    inputs[1].send_keys(batters[1])
    inputs[2].send_keys(bowler)

    if first_innings:
        CSK_Batters_Used.add(batters[0])
        CSK_Batters_Used.add(batters[1])
        RCB_Bowlers_Used.add(bowler)
    else:
        RCB_Batters_Used.add(batters[0])
        RCB_Batters_Used.add(batters[1])
        CSK_Bowlers_Used.add(bowler)

    driver.find_element(By.ID, "submit-names").click()

def fill_new_batter():
    wait.until(EC.visibility_of_element_located((By.ID, 'name-prompt-modal')))
    available_batters = [batter for batter in (CSK_Team if first_innings else RCB_Team) if batter not in (CSK_Batters_Used if first_innings else RCB_Batters_Used)]
    batter_name = random.choice(available_batters)
    inputs = driver.find_elements(By.CSS_SELECTOR, "#name-inputs input")
    inputs[0].send_keys(batter_name)
    driver.find_element(By.ID, "submit-names").click()

    if first_innings:
        CSK_Batters_Used.add(batter_name)
    else:
        RCB_Batters_Used.add(batter_name)

def fill_new_bowler():
    wait.until(EC.visibility_of_element_located((By.ID, 'name-prompt-modal')))
    available_bowlers = [bowler for bowler in (RCB_Bowl if first_innings else CSK_Bowl) if bowler not in (RCB_Bowlers_Used if first_innings else CSK_Bowlers_Used)]
    bowler_name = random.choice(available_bowlers)
    inputs = driver.find_elements(By.CSS_SELECTOR, "#name-inputs input")
    inputs[0].send_keys(bowler_name)
    driver.find_element(By.ID, "submit-names").click()

    if first_innings:
        RCB_Bowlers_Used.add(bowler_name)
    else:
        CSK_Bowlers_Used.add(bowler_name)

def click_action(action):
    if action in ['0', '1', '2', '3', '4', '6']:
        driver.find_element(By.CSS_SELECTOR, f".run-btn[data-runs='{action}']").click()
    elif action == 'wide':
        driver.find_element(By.ID, "wide-btn").click()
    elif action == 'noball':
        driver.find_element(By.ID, "noBall-btn").click()
    elif action == 'wicket':
        driver.find_element(By.ID, "wicket-btn").click()

# === Play Match ===
fill_starting_players(CSK_Team, RCB_Bowl[0])

over_ball_count = 0
wide_this_over = 0
noball_this_over = 0
wicket_this_over = 0
first_innings = True

#The user just needs to click the Continue Button at the Innings Break and at the End of The Match
while True:
    time.sleep(1.0)
    page_source = driver.page_source.lower()

    #Checking for Innings Break
    if "target" in page_source and first_innings:
        print("Innings Break! Setting up 2nd innings players.")
        fill_starting_players(RCB_Team, CSK_Bowl[0])
        first_innings = False
        over_ball_count = 0
        wide_this_over = 0
        noball_this_over = 0
        wicket_this_over = 0
        continue

    #Checking for Match Over
    if "match over" in page_source:
        print("Match Finished!")
        break

    #Checking if modal is open for new batter/bowler
    try:
        modal_title = driver.find_element(By.ID, 'modal-title').text.lower()
        if 'new batter' in modal_title or 'is out' in modal_title:
            fill_new_batter()
            continue
        elif 'new bowler' in modal_title or 'end of over' in modal_title:
            fill_new_bowler()
            over_ball_count = 0
            wide_this_over = 0
            noball_this_over = 0
            wicket_this_over = 0
            runout_this_over = 0
            continue
    except:
        pass  #Modal is not open

    #Event Decisions
    events = ['0', '1', '2', '3', '4', '6', 'wide', 'noball', 'wicket']
    weights = [15, 25, 10, 3, 10, 5, 2, 2, 3]

    if wide_this_over >= 1:
        weights[events.index('wide')] = 0
    if noball_this_over >= 1:
        weights[events.index('noball')] = 0
    if wicket_this_over >= 2:
        weights[events.index('wicket')] = 0

    action = random.choices(events, weights, k=1)[0]
    print(f"Ball Action: {action}")

    try:
        click_action(action)
    except Exception as e:
        print(f"Error Clicking {action}: {e}")

    if action in ['0', '1', '2', '3', '4', '6', 'wicket', 'runout']:
        over_ball_count += 1
    if action == 'wide':
        wide_this_over += 1
    if action == 'noball':
        noball_this_over += 1
    if action == 'wicket':
        wicket_this_over += 1

time.sleep(100)

